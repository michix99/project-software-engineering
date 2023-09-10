"""
    Testing the logger utility methods.
"""
import json
from unittest import mock
import pytest
from logger_utils import Logger, LogLevel


class TestLoggerUtils:
    """Contains tests for the logger utilites."""

    @pytest.fixture(scope="session", name="logger")
    def fixture_logger(self) -> Logger:
        """Create a fake "logger" for testing purpose."""
        logger = Logger(1, "dummy_component")
        return logger

    def test_log(self, logger) -> None:
        """Tests the basic log function."""
        with mock.patch("builtins.print") as print_mock:
            logger.log(LogLevel.INFO, "Dummy Message")

            print_mock.assert_called()
            call_args = print_mock.call_args.args[0]
            json_format_args = json.loads(call_args)
            assert json_format_args["severity"] == "INFO"
            assert json_format_args["message"] == "Dummy Message"
            assert json_format_args["component"] == "dummy_component"

    def test_no_log_when_to_low_log_level(self) -> None:
        """Tests that there should be no logging when the severity is to low."""
        with mock.patch("builtins.print") as print_mock:
            logger = Logger(3, "dummy_component")
            logger.log(LogLevel.DEBUG, "Dummy Message")

            print_mock.assert_not_called()

    def test_warn(self, logger) -> None:
        """Tests the logging of a warning."""
        with mock.patch("builtins.print") as print_mock:
            logger.warn(
                "Dummy warn Message", "different_component", {"additional": "field"}
            )

            print_mock.assert_called()
            call_args = print_mock.call_args.args[0]
            json_format_args = json.loads(call_args)
            assert json_format_args["severity"] == "WARN"
            assert json_format_args["message"] == "Dummy warn Message"
            assert json_format_args["component"] == "different_component"
            assert json_format_args["additional"] == "field"

    def test_info(self, logger) -> None:
        """Tests the logging of a info message."""
        with mock.patch("builtins.print") as print_mock:
            logger.info(
                "Dummy info Message", "different_component", {"additional": "field"}
            )

            print_mock.assert_called()
            call_args = print_mock.call_args.args[0]
            json_format_args = json.loads(call_args)
            assert json_format_args["severity"] == "INFO"
            assert json_format_args["message"] == "Dummy info Message"
            assert json_format_args["component"] == "different_component"
            assert json_format_args["additional"] == "field"

    def test_debug(self, logger) -> None:
        """Tests the logging of a warning."""
        with mock.patch("builtins.print") as print_mock:
            logger.debug(
                "Dummy debug Message", "different_component", {"additional": "field"}
            )

            print_mock.assert_called()
            call_args = print_mock.call_args.args[0]
            json_format_args = json.loads(call_args)
            assert json_format_args["severity"] == "DEBUG"
            assert json_format_args["message"] == "Dummy debug Message"
            assert json_format_args["component"] == "different_component"
            assert json_format_args["additional"] == "field"

    def test_error(self, logger) -> None:
        """Tests the logging of an error."""
        with mock.patch("builtins.print") as print_mock:
            logger.error(
                "Dummy error Message", "different_component", {"additional": "field"}
            )

            print_mock.assert_called()
            call_args = print_mock.call_args.args[0]
            json_format_args = json.loads(call_args)
            assert json_format_args["severity"] == "ERROR"
            assert json_format_args["message"] == "Dummy error Message"
            assert json_format_args["component"] == "different_component"
            assert json_format_args["additional"] == "field"
