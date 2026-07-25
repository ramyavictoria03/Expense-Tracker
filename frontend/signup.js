const API_URL = "http://127.0.0.1:8000/auth/signup";

document
  .getElementById("signupForm")
  .addEventListener("submit", async function (e) {

    e.preventDefault();

    const full_name = document.getElementById("full_name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                full_name,
                email,
                password
            })

        });

        const data = await response.json();

        if(response.ok){

            alert("Signup Successful!");

            window.location.href = "login.html";

        }else{

            alert(data.detail || "Signup Failed");

        }

    } catch(err){

        console.error(err);
        alert("Cannot connect to backend.");

    }

});