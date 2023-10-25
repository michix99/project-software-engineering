#!/usr/bin/env python
"""
    Project setup file.
"""

from setuptools import setup

main_ns = {}
with open("version.py", "r", encoding="UTF-8") as version_file:
    exec(version_file.read(), main_ns)  # pylint: disable=W0122

setup(
    name="project-software-engineering",
    version=main_ns["__version__"],
    description="Project Software Engineering - "
    + "Prototype Correction Management System REST Backend",
)
