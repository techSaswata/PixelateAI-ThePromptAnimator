#!/usr/bin/env python3
"""
Test script for PixelateAI generated Manim animations.
This script helps you test the generated Python code with Manim.

Usage:
1. Save your generated code from PixelateAI as 'animation.py'
2. Run: python manim_test.py
"""

import subprocess
import sys
import os

def install_manim():
    """Install Manim if not already installed."""
    try:
        import manim
        print("✅ Manim is already installed")
        return True
    except ImportError:
        print("📦 Installing Manim...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "manim"])
            print("✅ Manim installed successfully")
            return True
        except subprocess.CalledProcessError:
            print("❌ Failed to install Manim. Please install manually:")
            print("   pip install manim")
            return False

def test_animation(animation_file="animation.py"):
    """Test the animation file with Manim."""
    if not os.path.exists(animation_file):
        print(f"❌ Animation file '{animation_file}' not found")
        print("   Please save your generated code as 'animation.py'")
        return False
    
    print(f"🎬 Rendering animation from {animation_file}...")
    try:
        result = subprocess.run([
            sys.executable, "-m", "manim",
            animation_file,
            "Scene",  # Class name from PixelateAI
            "-qm",  # Medium quality
            "--preview"  # Open preview window
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Animation rendered successfully!")
            print("📁 Video saved in media/videos/ directory")
            return True
        else:
            print("❌ Animation rendering failed:")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Error running Manim: {e}")
        return False

def main():
    print("🎯 PixelateAI - Manim Animation Tester")
    print("=====================================")
    
    # Install Manim if needed
    if not install_manim():
        return
    
    # Test the animation
    if test_animation():
        print("\n🎉 Success! Your PixelateAI animation is ready!")
    else:
        print("\n💡 Tips for troubleshooting:")
        print("   - Make sure your animation.py file has a 'Scene' class")
        print("   - Check for syntax errors in the generated code")
        print("   - Verify Manim dependencies are installed")

if __name__ == "__main__":
    main() 