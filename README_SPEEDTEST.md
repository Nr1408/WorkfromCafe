# Wi-Fi Speed Test Feature

This project includes a lightweight Wi-Fi speed test integrated into the **Share Live Update** form (`CheckInFormScreen`).

## How it works
The component `components/SpeedTest.js` implements a simplified version of the M-Lab ndt7 test using public ndt7 WebSocket endpoints:
- `wss://<server>/ndt/v7/download` – measures download throughput for ~5.5s
- `wss://<server>/ndt/v7/upload` – measures upload throughput for ~5.5s

It calculates Mbps as `(bytes * 8) / seconds / 1e6` and displays incremental progress.

## Important Notes
- This is a minimal implementation and does not perform full server discovery (normally done via the M-Lab Locate API). It pins a known server hostname for demonstration.
- Some networks (captive portals / restrictive firewalls) may block WebSockets; the component will surface an error and allow retry.
- React Native's global `WebSocket` API is used (supported in Expo). No native module installation required.
- Results are approximate and intended for community reporting, not certification-level accuracy.

## Updating the Measured Value
When the test finishes, the download Mbps is written automatically into the Wi-Fi Speed field. Users can still edit the value manually before submitting.

## Fallback Strategy (Optional enhancement)
A simple fallback can be implemented by downloading a known static file (e.g., a CDN file) via `fetch` or `XMLHttpRequest` and timing the transfer if WebSocket fails. (Not yet implemented.)

## Privacy
The test connects to an M-Lab measurement server. M-Lab publishes anonymized measurement data. If stronger privacy controls are needed, add a consent checkbox before running the test.

## Future Improvements
- Implement Locate API to dynamically choose nearest server.
- Add jitter / latency measurement via control channel messages.
- Persist last result in local storage for reuse.
- Provide a fallback HTTP-based test.
