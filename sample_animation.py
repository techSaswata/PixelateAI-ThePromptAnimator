from manim import *
import numpy as np

class Scene(Scene):
    def construct(self):
        # Create axes
        ax = Axes(x_range=[-3, 3], y_range=[-1, 5], axis_config={"color": WHITE})
        
        # Create a parabola using the quadratic function y = x^2
        graph = ax.plot(lambda x: x**2, color=BLUE)
        
        # Add labels for the quadratic formula
        formula = MathTex("x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}").to_edge(UP)
        
        # Add a title
        title = Text("Quadratic Formula and Parabola").to_edge(UP)
        
        # Animate the axes, title, and graph
        self.play(Create(ax))
        self.play(Write(title))
        self.play(Write(formula))
        self.play(Create(graph))
        self.wait(2) 