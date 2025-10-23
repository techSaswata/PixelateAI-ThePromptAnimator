import openai
import os

# Note: API key should be set externally
# openai.api_key will be handled by the calling module

EXAMPLES_DIR = "examples"
SAVE_OUTPUT = True  # Set to False if you don't want to save output

def load_examples(folder):
    """Load few-shot examples from text files in the given folder."""
    messages = []
    
    # Handle both absolute and relative paths
    if not os.path.isabs(folder):
        folder = os.path.join(os.path.dirname(__file__), folder)
    
    if not os.path.exists(folder):
        print(f"Warning: Examples folder not found: {folder}")
        return messages
    
    for filename in sorted(os.listdir(folder)):
        if filename.endswith(".txt"):
            filepath = os.path.join(folder, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    text = f.read()
                    if "ASSISTANT:" in text:
                        user_part, assistant_part = text.split("ASSISTANT:", 1)
                        user_prompt = user_part.replace("USER:", "").strip()
                        assistant_response = assistant_part.strip()

                        messages.append({"role": "user", "content": user_prompt})
                        messages.append({"role": "assistant", "content": assistant_response})
            except Exception as e:
                print(f"Error loading example file {filename}: {e}")
                
    return messages

def main():
    # 🌟 Set system behavior
    system_message = {
        "role": "system",
        "content": (
            "You are an expert Python developer who generates Manim code for animations.\n"
            "Always follow this structure:\n"
            "- First give a brief mathematical explanation\n"
            "- Then provide Python code using Manim\n"
            "- Use Create(), Write(), Transform(), FadeIn(), FadeOut()\n"
            "- Class must be named 'Scene'\n"
            "- Use Text and MathTex for labels, with Unicode symbols like ×, ÷, √, etc.\n"
            "- Avoid overlapping elements, keep layout clean and readable.\n"
        )
    }

    # 📚 Load few-shot examples
    messages = [system_message] + load_examples(EXAMPLES_DIR)

    # ✏️ Add your custom prompt here
    custom_prompt = "Visualize and explain the Binomial Theorem"
    messages.append({"role": "user", "content": custom_prompt})

    # 🤖 Generate response
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=messages
    )

    output = response["choices"][0]["message"]["content"]
    print("\n" + "="*40 + "\nGenerated Output:\n" + "="*40)
    print(output)

    if SAVE_OUTPUT:
        filename = "_".join(custom_prompt.lower().split()[:5]) + ".py"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(output)
        print(f"\n✅ Saved output to: {filename}")

if __name__ == "__main__":
    main()
