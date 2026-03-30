import logging
import uvicorn


class _SuppressBadRequestFilter(logging.Filter):
    """Silence the 'Invalid HTTP request received' noise from ngrok TLS probes."""
    def filter(self, record: logging.LogRecord) -> bool:
        return "Invalid HTTP request received" not in record.getMessage()


if __name__ == "__main__":
    # Apply filter before uvicorn starts so it silences the noisy probe warnings
    logging.getLogger("uvicorn.error").addFilter(_SuppressBadRequestFilter())

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["app"],
        log_level="info",
        proxy_headers=True,
        forwarded_allow_ips="*",
    )
