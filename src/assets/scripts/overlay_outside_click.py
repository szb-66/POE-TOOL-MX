import ctypes
import json
import time

VK_LBUTTON = 0x01

def main():
    previous = False
    while True:
        pressed = bool(ctypes.windll.user32.GetAsyncKeyState(VK_LBUTTON) & 0x8000)
        if pressed and not previous:
            print(json.dumps({"event": "click"}), flush=True)
        previous = pressed
        time.sleep(0.015)

if __name__ == "__main__":
    main()
