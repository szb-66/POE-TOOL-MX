// GPL-3.0-or-later. Adapter for the pinned powzix/ooz decoder. This is NOT the
// proprietary Oodle library. Exports the narrow ABI required by LibBundle3.
#include <cstdint>
#include <cstring>
#include <vector>
#include <algorithm>
extern int Kraken_Decompress(const unsigned char*, size_t, unsigned char*, size_t);
#define API extern "C" __declspec(dllexport) intptr_t
API OodleLZ_Decompress(const unsigned char* input, intptr_t length, unsigned char* output, intptr_t size,
    int, int, int, void*, intptr_t, void*, void*, void*, intptr_t, int) {
    if (length < 0 || size < 0 || size > 16 * 1024 * 1024 || length > 32 * 1024 * 1024) return -1;
    // ooz explicitly requires 64 bytes of decoder overrun padding on both sides.
    std::vector<unsigned char> packed(static_cast<size_t>(length) + 64, 0);
    std::vector<unsigned char> decoded(static_cast<size_t>(size) + 64, 0);
    if (length) std::memcpy(packed.data(), input, static_cast<size_t>(length));
    int result = size == 0 ? 0 : Kraken_Decompress(packed.data(), static_cast<size_t>(length), decoded.data(), static_cast<size_t>(size));
    if (result != size) return -1;
    if (size) std::memcpy(output, decoded.data(), static_cast<size_t>(size));
    return size;
}
API OodleLZ_Compress(int, const unsigned char* input, intptr_t length, unsigned char* output,
    int, void*, void*, void*, void*, intptr_t) {
    if (length < 0 || length > 16 * 1024 * 1024) return -1;
    intptr_t written = 0;
    for (intptr_t offset = 0; offset < length; offset += 262144) {
        intptr_t bytes = (std::min)(intptr_t(262144), length - offset);
        output[written++] = 0xCC; output[written++] = 6; // restart, uncompressed, Kraken
        std::memcpy(output + written, input + offset, static_cast<size_t>(bytes)); written += bytes;
    }
    return written;
}
API OodleLZ_GetCompressedBufferSizeNeeded(int, intptr_t length) { return length + 2 * ((length + 262143) / 262144) + 64; }
API OodleLZ_GetCompressScratchMemBound(int, int, intptr_t, void*) { return 64; }
API OodleLZDecoder_MemorySizeNeeded(int, intptr_t) { return 64; }
