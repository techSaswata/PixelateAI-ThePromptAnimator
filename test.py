from manim import *

class PythagorasScene(Scene):
    def construct(self):
        # Title
        title = Text("Pythagoras' Theorem", font_size=48, color=BLUE)
        self.play(Write(title))
        self.wait(1)
        # Animate title to top edge
        self.play(title.animate.to_edge(UP), run_time=1)

        # Draw right triangle
        triangle = Polygon(ORIGIN, 4 * RIGHT, 3 * UP, color=YELLOW)
        triangle.shift(DOWN * 1)
        self.play(Create(triangle), run_time=2)

        # Label sides a, b, c
        a_label = MathTex("a", font_size=36).next_to(triangle.get_edge_center(UP), DOWN)
        b_label = MathTex("b", font_size=36).next_to(triangle.get_edge_center(RIGHT), LEFT)
        c_label = MathTex("c", font_size=36).next_to(triangle.get_vertices()[2], UR)
        self.play(Write(a_label), Write(b_label), Write(c_label))
        self.wait(1)

        # Create squares on each side
        square_a = Square(side_length=3, color=GREEN, fill_opacity=0.5)
        square_b = Square(side_length=4, color=PURPLE, fill_opacity=0.5)
        square_c = Square(side_length=5, color=ORANGE, fill_opacity=0.5)
        # Position squares
        square_a.next_to(triangle, LEFT, buff=0).align_to(triangle.get_edge_center(UP), UP)
        square_b.next_to(triangle, DOWN, buff=0).align_to(triangle.get_edge_center(RIGHT), RIGHT)
        square_c.rotate(-PI/2).next_to(triangle, UR, buff=0)

        self.play(FadeIn(square_a), FadeIn(square_b), FadeIn(square_c), run_time=2)
        self.wait(1)

        # Show areas a^2 and b^2
        area_sum = MathTex("a^2 + b^2", font_size=48)
        area_sum.next_to(title, DOWN * 1)
        self.play(Write(area_sum))
        self.wait(1)

        # Move squares to sum
        self.play(
            square_a.animate.move_to(area_sum.get_left() + LEFT * 1.5),
            square_b.animate.move_to(area_sum.get_right() + RIGHT * 1.5),
            run_time=2
        )
        self.wait(1)

        # Show equals c^2
        equals = MathTex("=", font_size=48).next_to(area_sum, RIGHT)
        c2 = MathTex("c^2", font_size=48).next_to(equals, RIGHT)
        self.play(Write(equals), Write(c2))
        self.wait(2)

        # Final formula animation
        formula = MathTex("a^2 + b^2 = c^2", font_size=64, color=RED)
        formula.to_edge(DOWN)
        self.play(
            Transform(area_sum, formula),
            FadeOut(square_a), FadeOut(square_b), FadeOut(square_c),
            FadeOut(equals), FadeOut(c2)
        )
        self.wait(3)

        # Explain in words
        explanation = Text(
            "In a right triangle,\n the sum of the squares of the legs (a and b)\n equals the square of the hypotenuse (c).",
            font_size=24,
            line_spacing=1.2
        ).next_to(formula, UP)
        self.play(FadeIn(explanation))
        self.wait(3)

        # End message
        self.play(FadeOut(explanation), FadeOut(formula), FadeOut(title))
        goodbye = Text("That's Pythagoras' Theorem!", font_size=36, color=BLUE)
        self.play(Write(goodbye))
        self.wait(2)