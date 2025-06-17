function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}

function initAutocomplete() {
    const input = document.getElementById("customerAddress");

    const autocomplete = new google.maps.places.Autocomplete(input, {
        types: ["address"],
        componentRestrictions: { country: "us" },
    });

    autocomplete.addListener("place_changed", function () {
        const place = autocomplete.getPlace();
        console.log("Selected place:", place.formatted_address);
    });
}


function calculateTotalCost() {
    const customerAddress = document.getElementById("customerAddress").value;
    const hours = parseInt(document.getElementById("hours").value);
    const resultDiv = document.getElementById("result");
    const includeSign = document.getElementById("includeSign").checked;
    const discountCode = document.getElementById("discountCode").value.trim().toLowerCase();
    const isOutdoor = document.getElementById("outdoorEvent").checked;
    const outdoorFee = isOutdoor ? 40 : 0;


    const installationFee = 25;
    let signFee = 0;

    if (includeSign) {
    if (hours <= 8) {
        signFee = Math.ceil(hours / 2) * 10;
    } else {
        signFee = 40;
    }
    }

    if (!customerAddress) {
        resultDiv.innerHTML = "Please enter a customer address.";
        return;
    }

    if (isNaN(hours) || hours <= 0) {
        resultDiv.innerHTML = "Please enter a valid number of rental hours.";
        return;
    }

    if (hours > 12) {
        resultDiv.innerHTML = "Maximum rental time is 12 hours.";
        return;
    }

    let rentalFee = 0;

    if (hours >= 1 && hours <= 2) {
        rentalFee = 100;
    } else if (hours >= 3 && hours <= 5) {
        rentalFee = 200;
    } else if (hours >= 6 && hours <= 12) {
        rentalFee = 250;
    }

    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
        {
            origins: ["12669 San Pablo Ave ste 101, Richmond, CA 94805"],
            destinations: [customerAddress],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.IMPERIAL,
        },
        function (response, status) {
            if (status !== "OK") {
                resultDiv.innerHTML = "Error calculating distance: " + status;
                return;
            }

            const distanceText = response.rows[0].elements[0].distance.text;
            const distanceMiles = parseFloat(distanceText.replace("mi", "").trim());
            const deliveryFee = Math.round(distanceMiles * 4);

            const appliedInstallationFee = installationFee;
            const subtotal = rentalFee + deliveryFee + appliedInstallationFee + signFee + outdoorFee;

            let subtotalAfterAutoDiscount = subtotal;

            let manualCodeDiscount = 0;
            let invalidCode = false;

            const discountCodes = {
                "earlybird": 0.10,
                "hostmyevent": 0.75
            };

            if (discountCode in discountCodes) {
                manualCodeDiscount = subtotalAfterAutoDiscount * discountCodes[discountCode];
            } else if (discountCode !== "") {
                invalidCode = true;
            }

            const total = subtotalAfterAutoDiscount - manualCodeDiscount;

            resultDiv.innerHTML = `
                <div class="fee-row type-line"><span>Distance: ${distanceMiles} miles</span><span>$${deliveryFee}</span></div>
                <div class="fee-row type-line"><span>Rental: ${hours} hour(s)</span><span>$${rentalFee}</span></div>
                <div class="fee-row type-line"><span>Installation Fee:</span><span>$${installationFee}</span></div>
                <div class="fee-row type-line"><span>LED Sign:</span><span>$${signFee}</span></div>
                <div class="fee-row type-line"><span>Outdoor Event:</span><span>$${outdoorFee}</span></div>
                ${manualCodeDiscount > 0 ? `<div class="fee-row type-line" style="color: green;"><span>Code Discount (${(discountCodes[discountCode] * 100).toFixed(0)}%)</span><span>- $${manualCodeDiscount.toFixed(2)}</span></div>` : ''}
                ${invalidCode ? `<div class="fee-row type-line" style="color: crimson;"><span>Invalid Code</span><span>${discountCode}</span></div>` : ''}
                <div class="fee-total type-line"><strong>Total:</strong><strong>$${total.toFixed(2)}</strong></div>
            `;

            document.getElementById("contactBtn").style.display = "inline-block";

            const lines = document.querySelectorAll(".type-line");
            lines.forEach((line, index) => {
                setTimeout(() => {
                    line.classList.add("show");
                }, index * 350);
            });
        }
    );
}