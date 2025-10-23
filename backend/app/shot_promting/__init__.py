"""
Short prompting module for enhanced AI code generation.

This module provides few-shot learning capabilities by loading examples
from text files and using them to improve the quality of generated Manim code.
"""

from .shot_promting import load_examples

__all__ = ['load_examples'] 