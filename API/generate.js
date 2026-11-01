
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "AI API key is not configured." });
  }

  const {
    name, age, goal, height, weight, targetWeight,
    experience, health, review
  } = req.body || {};

  if (!name || !age || !goal || !height || !weight || !targetWeight || !experience) {
    return res.status(400).json({ error: "Please complete all required fields." });
  }

  const safe = value => String(value || "Not provided").slice(0, 1000);

  const details = `
Name: ${safe(name)}
Age: ${age}
Goal: ${safe(goal)}
Height: ${height} cm
Current weight: ${weight} kg
Target weight: ${targetWeight} kg
Experience: ${safe(experience)}
Health conditions or injuries: ${safe(health)}
Client notes: ${safe(review)}
`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-5.5",
        instructions: `You are a responsible fitness coach for WASIF SHAH FITNESS.
Create a personalized plan with:
1. Client profile and goal
2. Weekly workout schedule
3. Exercises, sets and reps
4. Balanced meal suggestions
5. Sleep, hydration and recovery
6. Progress tracking.

Use realistic and safe guidance. Never recommend starvation,
extreme exercise, medicines or steroids. Do not diagnose illness.
For medical conditions or injuries, advise professional clearance.
For users under 18, avoid restrictive weight-loss diets and recommend
parent/guardian and qualified professional guidance.
Never promise height increase. Focus on posture and mobility for
height-related goals. This is general fitness education, not medical advice.
Write in simple English with clear headings.`,
        input: `Create the fitness plan using these details:\n${details}`,
        max_output_tokens: 2000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(502).json({ error: "AI service failed. Please try again." });
    }

    const plan = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    if (!plan) {
      return res.status(502).json({ error: "AI returned an empty plan." });
    }

    return res.status(200).json({ success: true, plan });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
}
