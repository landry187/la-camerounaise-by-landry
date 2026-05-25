const form = document.getElementById("reservationForm");

const foods = document.querySelectorAll(".food");

const totalPrice = document.getElementById("totalPrice");

const advancePrice = document.getElementById("advancePrice");


// ===== CALCUL TOTAL =====

foods.forEach(food => {

    food.addEventListener("change", () => {

        let total = 0;

        foods.forEach(item => {

            if(item.checked){

                total += Number(item.value);

            }

        });

        totalPrice.textContent = total + " FCFA";

        advancePrice.textContent =
        (total / 2) + " FCFA";

    });

});


// ===== ENVOI FORMULAIRE =====

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const formData = new FormData(form);

    const data = {

        nom: formData.get("nom"),

        telephone: formData.get("telephone"),

        personnes: formData.get("personnes"),

        date: formData.get("date"),

        heure: formData.get("heure"),

        message: formData.get("table")

    };

    try {

        const response = await fetch(
            "http://localhost:3000/reservation",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)

            }
        );

        const result = await response.json();

        alert(result.message);

        form.reset();

    } catch (error) {

        console.log(error);

        alert("Erreur serveur");

    }

});