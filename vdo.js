// Step 1: Submit video generation request
const response = await fetch("https://openrouter.ai/api/v1/videos", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <OPENROUTER_API_KEY>",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "bytedance/seedance-2.0",
    prompt: "A serene mountain landscape at sunset with clouds drifting by",
  }),
});

const result = await response.json();
const jobId = result.id;
const pollingUrl = result.polling_url;
console.log("Job submitted:", jobId);

// Step 2: Poll for completion
const poll = async () => {
  while (true) {
    const pollResponse = await fetch(pollingUrl, {
      headers: {
        "Authorization": "Bearer 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",
      },
    });
    const statusData = await pollResponse.json();
    console.log("Status:", statusData.status);

    if (statusData.status === "completed") {
      for (const url of statusData.unsigned_urls ?? []) {
        console.log("Video URL:", url);
      }
      return;
    }

    if (statusData.status === "failed") {
      console.error("Error:", statusData.error ?? "Unknown error");
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
};

await poll();