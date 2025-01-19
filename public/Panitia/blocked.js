// Function to check screen width and toggle display
function toggleContentDisplay() {
    const content = document.getElementById("content");
    const blocked = document.getElementById("set-block");
  
    // Check if the screen width is 768px or less
    if (window.innerWidth <= 760) {
      content.style.display = "block";
      blocked.style.display = "none";
    } else {
      content.style.display = "none";
      blocked.style.display = "block";
    }
  }
  
  // Run the function on page load
  toggleContentDisplay();
  
  // Add an event listener to handle window resize
  window.addEventListener("resize", toggleContentDisplay);
  