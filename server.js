console.log("Starting server...");
const express = require("express");
const puppeteer = require("puppeteer-core");
const cors = require("cors");

console.log("✅ Modules loaded successfully...");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate-pdf", async (req, res) => {
    try {
        console.log("Received request to generate PDF...");
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: "URL is required" });

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome-stable", 
            args: [
                "--no-sandbox",
        	"--disable-setuid-sandbox",
        	"--disable-dev-shm-usage",
        	"--disable-accelerated-2d-canvas",
        	"--disable-gpu",
        	"--no-zygote",
        	"--single-process",
        	"--disable-background-networking",
        	"--disable-software-rasterizer",
        	"--mute-audio"
            ]
        });

	console.log("📝 Creating new page...");
        const page = await browser.newPage();
	console.log("🔗 Navigating to:", url);
        await page.goto(url, { waitUntil: "networkidle2" });

        console.log("Processing MathJax...");
        await page.evaluate(() => {
            return new Promise((resolve) => {
                if (window.MathJax) {
                    MathJax.typesetPromise().then(resolve);
                } else {
                    resolve();
                }
            });
        });

        console.log("Generating PDF...");
        const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
	console.log("🔒 Closing browser...");
        await browser.close();

        console.log("PDF generated, sending response...");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=exercise.pdf");
        res.send(pdfBuffer);
    } catch (error) {
        console.error("PDF generation error:", error);
        res.status(500).json({ error: "PDF generation failed" });
    }
});

// ✅ Define PORT properly
const PORT = process.env.PORT || 8080;

// ✅ Start the server correctly
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
});

// ✅ Handle errors properly
server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error("Port already in use. Trying another port...");
        server.listen(0);
    } else {
        console.error("Server error:", err);
    }
});
