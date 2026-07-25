const API_URL = "http://127.0.0.1:8000/auth/login";

const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();
        console.log("Login response:", data);


        if (!response.ok) {
            alert(data.detail || "Login failed");
            return;
        }

        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Login Successful!");

        window.location.href = "index.html";

    } catch (err) {

        console.error(err);

        alert("Server Error");

    }

});