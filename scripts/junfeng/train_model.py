"""开发机训练小型 CNN 并导出 logits + 32 维 embedding 的 ONNX。需要 torch。"""
import argparse
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset, WeightedRandomSampler


class HighlightNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 16, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(16, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 48, 3, padding=1), nn.ReLU(), nn.AdaptiveAvgPool2d(1))
        self.embedding = nn.Linear(48, 32)
        self.classifier = nn.Linear(32, 3)

    def forward(self, value):
        visual = self.features(value).flatten(1)
        raw_embedding = self.embedding(visual)
        embedding = nn.functional.normalize(raw_embedding, dim=1)
        return self.classifier(raw_embedding), embedding


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", required=True)
    parser.add_argument("--output", default="src/assets/models/junfeng-highlight/model.onnx")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--seed", type=int, default=20260810)
    parser.add_argument("--model-version", required=True)
    parser.add_argument("--device", default="auto", choices=("auto", "cpu", "cuda"))
    parser.add_argument("--validation-domain", default="junfeng",
                        help="只从该来源域选择独立验证会话；其他来源全部用于训练")
    parser.add_argument("--events", action="store_true", help="输出供开发版训练工作台消费的进度事件")
    args = parser.parse_args()
    data = np.load(args.dataset)
    unique_sessions = sorted(set(data["sessions"].tolist()))
    if len(unique_sessions) < 5:
        raise SystemExit("至少需要 5 个独立采集会话")
    rng = np.random.default_rng(args.seed)
    domains = data["domains"] if "domains" in data.files else np.asarray(["junfeng"] * len(data["sessions"]))
    partitions = data["partitions"] if "partitions" in data.files else np.asarray(["legacy"] * len(data["sessions"]))
    audited = data["audited"] if "audited" in data.files else np.zeros(len(data["sessions"]), dtype=np.bool_)
    domain_mask = np.asarray([str(domain).startswith(args.validation_domain) for domain in domains])
    curated_validation = sorted(set(data["sessions"][domain_mask & (partitions == "validation") & audited].tolist()))
    test_sessions = sorted(set(data["sessions"][domain_mask & (partitions == "test") & audited].tolist()))
    if len(curated_validation) >= 2:
        validation_sessions = set(curated_validation)
        split_mode = "audited"
    else:
        eligible_sessions = sorted(set(data["sessions"][(domains == args.validation_domain) & (partitions == "legacy")].tolist()))
        if len(eligible_sessions) < 5:
            raise SystemExit(f"验证来源 {args.validation_domain} 需要至少 2 个已审计验证会话，或 5 个旧独立会话")
        rng.shuffle(eligible_sessions)
        validation_sessions = set(eligible_sessions[:max(1, round(len(eligible_sessions) * 0.2))])
        split_mode = "legacy-auto-label"
    test_session_set = set(test_sessions)
    train_mask = np.asarray([session not in validation_sessions and session not in test_session_set
                             and partition not in ("validation", "test")
                             for session, partition in zip(data["sessions"], partitions)])
    rgb_images = np.asarray([cv2.cvtColor(image, cv2.COLOR_BGR2RGB) for image in data["images"]])
    images = torch.from_numpy(rgb_images.transpose(0, 3, 1, 2)).float() / 255.0
    labels = torch.from_numpy(data["labels"]).long()
    use_cuda = args.device == "cuda" or (args.device == "auto" and torch.cuda.is_available())
    if args.device == "cuda" and not torch.cuda.is_available():
        raise SystemExit("已要求使用 CUDA，但当前 PyTorch 无法访问 GPU")
    device = torch.device("cuda" if use_cuda else "cpu")
    torch.manual_seed(args.seed)
    if use_cuda:
        torch.cuda.manual_seed_all(args.seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False
    train_labels = data["labels"][train_mask]
    train_domains = domains[train_mask]
    balance_domains = np.asarray(["junfeng" if str(domain).startswith("junfeng") else str(domain)
                                  for domain in train_domains])
    group_counts = {}
    for domain, label in zip(balance_domains.tolist(), train_labels.tolist()):
        key = (str(domain), int(label))
        group_counts[key] = group_counts.get(key, 0) + 1
    sample_weights = np.asarray([1.0 / group_counts[(str(domain), int(label))]
                                 for domain, label in zip(balance_domains.tolist(), train_labels.tolist())],
                                dtype=np.float64)
    generator = torch.Generator().manual_seed(args.seed)
    sampler = WeightedRandomSampler(torch.from_numpy(sample_weights), len(sample_weights), replacement=True,
                                    generator=generator)
    loader = DataLoader(TensorDataset(images[train_mask], labels[train_mask]), batch_size=64, sampler=sampler,
                        pin_memory=use_cuda)
    model = HighlightNet().to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    model.train()
    for epoch in range(args.epochs):
        total_loss = 0.0
        batches = 0
        for batch, target in loader:
            batch = batch.to(device, non_blocking=use_cuda)
            target = target.to(device, non_blocking=use_cuda)
            optimizer.zero_grad()
            logits = model(batch)[0]
            loss = nn.functional.cross_entropy(logits, target)
            loss.backward()
            optimizer.step()
            total_loss += float(loss.detach().cpu())
            batches += 1
        if args.events and ((epoch + 1) % 5 == 0 or epoch == 0 or epoch + 1 == args.epochs):
            print("EVENT " + json.dumps({"epoch": epoch + 1, "epochs": args.epochs,
                                          "loss": total_loss / max(1, batches)}, ensure_ascii=False), flush=True)
    model.eval().cpu()
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(model, torch.zeros(1, 3, 64, 64), output, input_names=["input"],
                      output_names=["logits", "embedding"], dynamic_axes={"input": {0: "batch"},
                      "logits": {0: "batch"}, "embedding": {0: "batch"}}, opset_version=17,
                      dynamo=False)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    manifest = {"schemaVersion": 1, "architectureVersion": 1, "modelVersion": args.model_version,
                "classes": ["highlighted", "dimmed", "empty"], "inputName": "input",
                "inputSize": {"width": 64, "height": 64},
                "outputs": {"logits": "logits", "embedding": "embedding"}, "sha256": digest,
                "benchmark": {"passed": False}}
    output.with_name("manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), "utf-8")
    output.with_name("split.json").write_text(json.dumps({"validationDomain": args.validation_domain,
                                                           "mode": split_mode,
                                                           "validationSessions": sorted(validation_sessions),
                                                           "testSessions": test_sessions},
                                                          indent=2), "utf-8")
    print(json.dumps({"modelVersion": args.model_version, "device": str(device), "epochs": args.epochs,
                      "trainingSessions": sorted(set(data["sessions"][train_mask].tolist())),
                      "validationSessions": sorted(validation_sessions), "testSessions": test_sessions,
                      "splitMode": split_mode, "output": str(output)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
