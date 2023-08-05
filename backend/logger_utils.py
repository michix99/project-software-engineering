"""
Provides logging utility methods.
Needed as the default logger cannot be used within the function framework.
"""
from datetime import datetime
import json
from enum import IntEnum


class LogLevel(IntEnum):
    """Enum containing all the possible log levels."""

    DEBUG = 1
    INFO = 2
    WARN = 3
    ERROR = 4


class Logger:
    """The logger class to initalize within the function call."""

    def __init__(self, log_level=2, component="UNDEFINED") -> None:
        self.log_level = log_level
        self.component = component

    def log(
        self,
        severity: LogLevel,
        message: str,
        component: str = None,
        additional_fields: dict = None,
    ) -> None:
        """Generic log method, that prints a JSON string to the console.
        Args:
            severity - The importance of the log message.
            message - The text to log.
            component - The component which reports the log message.
            additional_fields - Optional extra fields inclued in the log message.
        """
        if severity.value < self.log_level:
            return

        entry = {
            "time": datetime.now().isoformat(),
            "severity": severity.name,
            "message": message,
            "component": component if component else self.component,
            **(additional_fields if additional_fields else {}),
        }

        print(json.dumps(entry))

    def debug(
        self, message: str, component: str = None, additional_fields: dict = None
    ) -> None:
        """Generic log method for severity DEBUG.
        Args:
            message - The text to log.
            component - The component which reports the log message.
            additional_fields - Optional extra fields inclued in the log message.
        """
        self.log(LogLevel.DEBUG, message, component, additional_fields)

    def info(
        self, message: str, component: str = None, additional_fields: dict = None
    ) -> None:
        """Generic log method for severity INFO.
        Args:
            message - The text to log.
            component - The component which reports the log message.
            additional_fields - Optional extra fields inclued in the log message.
        """
        self.log(LogLevel.INFO, message, component, additional_fields)

    def warn(
        self, message: str, component: str = None, additional_fields: dict = None
    ) -> None:
        """Generic log method for severity WARN.
        Args:
            message - The text to log.
            component - The component which reports the log message.
            additional_fields - Optional extra fields inclued in the log message.
        """
        self.log(LogLevel.WARN, message, component, additional_fields)

    def error(
        self, message: str, component: str = None, additional_fields: dict = None
    ) -> None:
        """Generic log method for severity ERROR.
        Args:
            message - The text to log.
            component - The component which reports the log message.
            additional_fields - Optional extra fields inclued in the log message.
        """
        self.log(LogLevel.ERROR, message, component, additional_fields)
