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

    let rentalFee = hours * 75;

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

            const appliedInstallationFee = (hours >= 10 && hours <= 12) ? 0 : installationFee;
            const subtotal = rentalFee + deliveryFee + appliedInstallationFee + signFee + outdoorFee;

            let discount = 0;
            let applyDiscount = false;
            let waiveInstallationFee = false;

            if (hours >= 7 && hours <= 9) {
                discount = subtotal * 0.10;
                applyDiscount = true;
            } else if (hours >= 10 && hours <= 12) {
                discount = subtotal * 0.10;
                applyDiscount = true;
                waiveInstallationFee = true;
            }

            let subtotalAfterAutoDiscount = subtotal - discount;

            let manualCodeDiscount = 0;
            let invalidCode = false;

            if (discountCode === "earlybird") {
                manualCodeDiscount = subtotalAfterAutoDiscount * 0.10; 
            } else if (discountCode !== "") {
                invalidCode = true;
            }

            const total = subtotalAfterAutoDiscount - manualCodeDiscount;


            resultDiv.innerHTML = `
                <div class="fee-row type-line"><span>Distance: ${distanceMiles} miles</span><span>$${deliveryFee}</span></div>
                <div class="fee-row type-line"><span>Rental: ${hours} hour(s)</span><span>$${rentalFee}</span></div>
                <div class="fee-row type-line"><span>Installation Fee:</span>
                    <span>${hours >= 10 && hours <= 12 ? `<s>$${installationFee}</s> $0` : `$${installationFee}`}</span>
                </div>
                <div class="fee-row type-line"><span>LED Sign:</span><span>$${signFee}</span></div>
                <div class="fee-row type-line"><span>Outdoor Event:</span><span>$${outdoorFee}</span></div>
                ${applyDiscount ? `<div class="fee-row type-line" style="color: green;"><span>10% Discount</span><span>- $${discount.toFixed(2)}</span></div>` : ''}
                ${manualCodeDiscount > 0 ? `<div class="fee-row type-line" style="color: green;"><span>Code Discount (10%)</span><span>- $${manualCodeDiscount.toFixed(2)}</span></div>` : ''}
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