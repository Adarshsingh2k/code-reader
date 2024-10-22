// backend/server.js
const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const fs = require("fs");
const app = express();
const path = require("path");

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the frontend build directory (optional)
app.use(express.static(path.join(__dirname, "../video-form/build")));

// Endpoint to trigger npm build
app.post("/compile", (req, res) => {
  exec(
    "npm run build",
    { cwd: path.join(__dirname, "../video-form") },
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return res
          .status(500)
          .json({ message: `Build failed: ${error.message}` });
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
        return res.status(500).json({ message: `Build stderr: ${stderr}` });
      }
      res.json({ message: "Build successful", output: stdout });
    }
  );
});

app.post("/get-new-config", (req, res) => {
  const updatedProps = req.body;

  // Generate new config based on updatedProps
  const newConfig = {
    settings: updatedProps,
    generatedAt: new Date().toISOString(),
  };

  // Save the new config to a file (optional)
  const configPath = path.join(__dirname, "new-config.json");
  fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), (err) => {
    if (err) {
      console.error("Failed to write config file:", err);
      return res.status(500).json({ message: "Failed to save config file" });
    }
    console.log("New config file saved successfully:", newConfig);
  });

  // Send the new configuration back to the frontend
  res.json(newConfig);
});

//updating config in videolanding
app.post("/update-config-and-build", (req, res) => {
  const updatedProps = req.body.video;
  console.log(updatedProps?.video_id);

  // Apply the same structure
  // const newConfig = {
  //   video_id: updatedProps.video_id || "",
  //   product_name: updatedProps.product_name || "",
  //   product_photo: updatedProps.product_photo || "",
  //   rating: updatedProps.rating || 0,
  //   star_color: updatedProps.star_color || "#FFFFFF",
  //   reviews: updatedProps.reviews || 0,
  //   review_text: updatedProps.review_text || "",
  //   review_font_size: updatedProps.review_font_size || "16px",
  //   review_font_family: updatedProps.review_font_family || "Arial",
  //   review_font_color: updatedProps.review_font_color || "#000000",
  //   subtitle_text: updatedProps.subtitle_text || "",
  //   subtitle_font_size: updatedProps.subtitle_font_size || "14px",
  //   subtitle_font_family: updatedProps.subtitle_font_family || "Arial",
  //   subtitle_font_color: updatedProps.subtitle_font_color || "#FFFFFF",
  //   title_text: updatedProps.title_text || "",
  //   title_font_size: updatedProps.title_font_size || "2rem",
  //   title_font_family: updatedProps.title_font_family || "Times New Roman",
  //   title_font_color: updatedProps.title_font_color || "#000000",
  //   discounted_price: updatedProps.discounted_price || 0,
  //   original_price: updatedProps.original_price || 0,
  //   button_text: updatedProps.button_text || "Buy Now",
  //   background_color: updatedProps.background_color || "#000000",
  //   background_opacity: updatedProps.background_opacity || "1",
  // };
  const newConfig = updatedProps;
  // Write this config to video-landing
  const videoLandingConfigPath = path.join(
    __dirname,
    "../video-landing/config.json"
  );

  //-------------------------------------------------

  fs.writeFile(
    videoLandingConfigPath,
    JSON.stringify(newConfig, null, 2),
    (err) => {
      if (err) {
        console.error("Failed to write config file:", err);
        return res.status(500).json({ message: "Failed to save config file" });
      }

      console.log(
        "New config file saved successfully to video-landing:",
        newConfig
      );

      // Step 1: Trigger the npm run build command
      exec(
        "npm run build",
        { cwd: path.join(__dirname, "../video-landing") },
        (error, stdout, stderr) => {
          if (error) {
            console.error(`Build Error: ${error.message}`);
            return res
              .status(500)
              .json({ message: `Build failed: ${error.message}` });
          }
          if (stderr) {
            console.error(`Build Stderr: ${stderr}`);
            return res.status(500).json({ message: `Build stderr: ${stderr}` });
          }

          console.log("Build successful for video-landing:", stdout);

          // Step 2: Run the s3.py Python script after build completes
          exec(
            "python s3.py",
            { cwd: path.join(__dirname, "../video-landing") },
            (error, stdout, stderr) => {
              if (error) {
                console.error(`Python Script Error: ${error.message}`);
                return res
                  .status(500)
                  .json({ message: `Python script failed: ${error.message}` });
              }
              if (stderr) {
                console.error(`Python Script Stderr: ${stderr}`);
                return res
                  .status(500)
                  .json({ message: `Python script stderr: ${stderr}` });
              }
              console.log("S3 Upload Succesfull", stdout);
              res.json({
                message: "Build and S3 upload successful for video-landing",
                output: stdout,
              });
            }
          );
        }
      );
    }
  );

  //---------------------------------------------------

  // fs.writeFile(
  //   videoLandingConfigPath,
  //   JSON.stringify(newConfig, null, 2),
  //   (err) => {
  //     if (err) {
  //       console.error("Failed to write config file:", err);
  //       return res.status(500).json({ message: "Failed to save config file" });
  //     }

  //     console.log(
  //       "New config file saved successfully to video-landing:",
  //       newConfig
  //     );

  //     // Trigger the build
  //     // exec(
  //     //   "npm run build",
  //     //   { cwd: path.join(__dirname, "../video-landing") },
  //     //   (error, stdout, stderr) => {
  //     //     if (error) {
  //     //       console.error(`Build Error: ${error.message}`);
  //     //       return res
  //     //         .status(500)
  //     //         .json({ message: `Build failed: ${error.message}` });
  //     //     }
  //     //     if (stderr) {
  //     //       console.error(`Build Stderr: ${stderr}`);
  //     //       return res.status(500).json({ message: `Build stderr: ${stderr}` });
  //     //     }

  //     //     res.json({
  //     //       message: "Build successful for video-landing",
  //     //       output: stdout,
  //     //     });
  //     //   }
  //     // );
  //   }
  // );
});

// Catch-all handler for serving the React frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
