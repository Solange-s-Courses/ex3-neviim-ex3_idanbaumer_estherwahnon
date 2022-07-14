"use strict";

const APIKEY = "rG5MizEy57zyvlatgwM0ftKwCl0jDTNiqv6GhLUa";


const validatorModule = (function () {

    let classes = {}
    classes.ValidMission = class ValidMission {
        constructor(rover_name, landing_date, max_sol, max_date) {
            this.rover_name = rover_name;
            this.landing_date = landing_date;
            this.max_sol = max_sol;
            this.max_date = max_date;
        }
    }
    classes.ValidMissionList = class {
        constructor() {
            this.list = [];
        }

        add(validMission) {
            this.list.push(validMission);
        }
    }

    const isNotEmpty = function (str) {
        return {
            isValid: (str.length !== 0), message: 'please enter input'
        };
    }
    /**
     * check if string is a validate date in a YYYY-MM-DD format or Sol
     * @param str - chosen date to as a string
     * @returns {{isValid: boolean, message: string}} - return error message and true or false if valid
     */
    const validDate = function (str) {
        return {
            isValid: /^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/.test(str) || /^[1-9][0-9]*$/.test(str),
            message: 'text must be a date or a sol'
        };
    }

    /**
     * check if date is in range before maximum date of mission and after minimum mission
     * @param dates - first element is input date, second is maximum and third is minimum
     * @returns {{isValid: boolean, message: string}} - return error message and true or false if valid
     */
    const dateInRange = function (dates) {
        if (dates[0] < dates[1]) {
            return {
                isValid: false, message: `text must be a date after ${dates[1]}`
            };
        } else if (dates[0] > dates[2]) {
            return {
                isValid: false, message: `text must be a date before ${dates[2]}`
            };
        } else {
            return {
                isValid: true, message: ""
            };
        }
    }

    /**
     * function to check if sol is in maximum range
     * @param sols - chosen sol in first element, second is maximum sol
     * @returns {{isValid: boolean, message: string}} - return error message and true or false if valid
     */
    const solInRange = function (sols) {
        return {
            isValid: sols[0] < sols[1], message: `text must be a sol before ${sols[1]}`
        };
    }

    /**
     * check if input is string or sol
     * @param str - wanted date
     * @returns {boolean} - return true if date or false if sol
     */
    const dateOrSol = (str) => {
        return /^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/.test(str);
    }

    return {
        isNotEmpty: isNotEmpty,
        validDate: validDate,
        dateOrSol: dateOrSol,
        dateInRange: dateInRange,
        solInRange,
        solInRange,
        classes
    }
})();

(function () {
    let photosJson = null;
    let imagesCardsElem = null;
    let dateElem = null;
    let roverElem = null;
    let cameraElem = null;
    let carouselElem = null;
    let validatorList = new validatorModule.classes.ValidMissionList();
    let savedListElem = null;
    let savedPhotos = [];

    /**
     * function to check if specific input is valid
     * @param inputElement - element value to check
     * @param errorElement - error element to output error if happend
     * @param validateFunc - function to validate
     * @returns {*} - return if true or false
     */
    const validateInput = (inputElement, errorElement, validateFunc) => {
        // let errorElement = inputElement.nextElementSibling;
        const v = validateFunc(inputElement);

        errorElement.innerHTML = v.isValid ? '' : v.message;
        errorElement.hidden = v.isValid ? true : false;
        return v.isValid;
    }

    function status(response) {
        if (response.status >= 200 && response.status < 300) {
            return Promise.resolve(response);
        } else {
            return Promise.reject(new Error(response.statusText));
        }
    }

    /**
     * function to get images from nasa servers, and show them to the user
     * @param date - wanted date
     * @param rover - wanted mission
     * @param camera - wanted camera
     */
    function getImages(date, rover, camera) {
        const dateOrSol = validatorModule.dateOrSol(date);
        fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?${dateOrSol ? "earth_date=" : "sol="}${date}&camera=${camera}&api_key=${APIKEY}`)
            .then(status)
            .then(res => res.json())
            .then(json => {
                photosJson = json.photos;
                imagesCardsElem.innerHTML = setImages(photosJson);
                attachSaveBtnsListeners();
                if (imagesCardsElem.firstElementChild.childElementCount === 0) {
                    imagesCardsElem.innerHTML = "<p>No pictures found</p>"
                }
            })
            .catch(function (err) {
                alert("Error in nasa servers, please refresh the page");
            })
    }

    /**
     * function to set images to show
     * @param images - the images json to show
     * @returns {string} - return html element to show
     */
    function setImages(images) {
        let res = '<div class="row">';
        images.forEach((item) => {
            res += toHTMLCard(item);
        });
        res += '</div>';
        return res;
    }

    /**
     * create html card of current photo
     * @param current - current photo json
     * @returns {string} - html format of card
     */
    function toHTMLCard(current) {
        return `
                <div class="col-md-4">
                    <div class="card">
                        <img class="card-img-top" src=${current.img_src} alt="card image">
                        <div class="card-body">
                            <p class="card-text">Earth date: ${current.earth_date}</p>
                            <p class="card-text">Sol: ${current.sol}</p>
                            <p class="card-text" id="camName" >Camera: ${current.camera.name}</p>
                            <p class="card-text">Mission: ${current.rover.name}</p>
                            <a href="${current.img_src}" target="_blank" button type="button" class="btn-full btn btn-primary">Full resolution</a>
                            <button type="button" class="btn-save btn btn-primary">Save</a>
                        </div>
                    </div>
                </div>
                `;
    }

    /**
     * function to return saved list html format
     * @param current - current image to set
     * @returns {string} - image as saved list format
     */
    function toHTMLSavedList(current) {
        return `
                <li>
                <a href=${current.img_src} target="_blank">Image id: ${current.id}</a>
                <p>Earth date: ${current.earth_date}, Sol: ${current.sol}, Camara: ${current.camera.name}</p>
                </li>
        `
    }

    /**
     * function to create picture in carousle picture format
     * @param current - current card
     * @param first - check if first element so add "active" to the card
     * @returns {string} - return image as carousle format
     */
    function toHTMLCarousleItem(current, first) {
        return `
        <div class="carousel-item${first ? " active" : ""}">
            <img src=${current.img_src} class="d-block w-100" alt="image">
                <div class="carousel-caption d-none d-md-block">
                    <h5>${current.camera.name}</h5>
                    <p>${current.earth_date}</p>
                    <a href="${current.img_src}" target="_blank" button type="button" class="btn-full btn btn-primary">Full resolution</a>
                </div>
        </div>
        `
    }

    /**
     * function to attach save buttons listeners to do an action
      */
    function attachSaveBtnsListeners() {
        for (const b of imagesCardsElem.getElementsByClassName("btn-save")) b.addEventListener('click', save);
    }

    /**
     * reset form to default values
     */
    function initialForm() {
        imagesCardsElem.innerHTML = "";
        document.querySelectorAll("#todo-input-form > div.alert").forEach(element => {
            element.hidden = true
        });
    }

    /**
     * function which handle save card to list and carousle
     * @param event - the card which we'd like to  save
     */
    const save = (event) => {
        const imgPressed = event.target.parentElement.parentElement.firstElementChild.currentSrc;
        const photo = photosJson.find(element => element.img_src === imgPressed)
        if (!savedPhotos.includes(photo)) {
            savedPhotos.push(photo);
            //here we have to add all the information
            savedListElem.insertAdjacentHTML('beforeend', toHTMLSavedList(photo));
            carouselElem.firstElementChild.insertAdjacentHTML('beforeend', toHTMLCarousleItem(photo, savedListElem.childElementCount === 1));
            console.log(carouselElem.innerHTML);
        }
        else {
            alert("You have already saved this image, Please try a new one!");
        }
    }

    /**
     * initialier different validators of missions
     */
    function initialeValidators() {
        initialeValidator("Curiosity");
        initialeValidator("Opportunity");
        initialeValidator("Spirit");
    }

    /**
     * initalize each validator and recieve iuts data
     * @param str -  string input for data
     */
    function initialeValidator(str) {
        fetch(`https://api.nasa.gov/mars-photos/api/v1/manifests/${str}?api_key=${APIKEY}`)
            .then(status)
            .then(res => res.json())
            .then(json => {
                const manifest = json.photo_manifest;
                validatorList.add(new validatorModule.classes.ValidMission(str, new Date(manifest.launch_date), manifest.max_sol, new Date(manifest.max_date)));
            })
            .catch(function (err) {
                alert("Error in nasa servers, please refresh the page");
                document.querySelector("container").hidden = true;
            })
    }

    /**
     * check if input is  valid according to server
     * @param the_date - input date by  the user
     * @returns {boolean|*} - true or false if valid or invalid
     */
    function validateDateFromServer(the_date) {
        const roverData = validatorList.list.find(element => element.rover_name === roverElem.value);
        if (roverData === undefined) return false;
        return validatorModule.dateOrSol(the_date.value) ? validateInput([new Date(the_date.value), roverData.landing_date, roverData.max_date], the_date.nextElementSibling, validatorModule.dateInRange) : validateInput([the_date.value, roverData.max_sol], the_date.nextElementSibling, validatorModule.solInRange);
    }

    /**
     * check if form is valid
     * @param theDateElem -  date element for  input
     * @param theRoverElem - rover element for input
     * @param theCameraElem - camera element from input
     * @returns {*|boolean} - returns true if valid or false if form is invalid
     */
    const validateForm = (theDateElem, theRoverElem, theCameraElem) => {
        theDateElem.value = theDateElem.value.trim();
        const v1 = validateInput(theDateElem.value, theDateElem.nextElementSibling, validatorModule.isNotEmpty) && validateInput(theDateElem.value, theDateElem.nextElementSibling, validatorModule.validDate) && validateDateFromServer(theDateElem);
        const v2 = validateInput(theRoverElem.value, theRoverElem.nextElementSibling, validatorModule.isNotEmpty);
        const v3 = validateInput(theCameraElem.value, theCameraElem.nextElementSibling, validatorModule.isNotEmpty);
        const v = v1 && v2 && v3;
        return v;
    }

    /**
     * function which handle what happens when the page finished loading
     */
    document.addEventListener('DOMContentLoaded', function () {
        imagesCardsElem = document.getElementById("imagesList");
        dateElem = document.getElementById("search-text");
        roverElem = document.getElementById("roverSelect");
        cameraElem = document.getElementById("cameraSelect");
        carouselElem = document.getElementById("carousel");
        savedListElem = document.getElementById("savedPicLists");
        initialeValidators();
        document.getElementById("slideBtn").addEventListener('click', () => {
            (savedListElem.childElementCount > 0) ? carouselElem.hidden = false : alert("Saved images list is empty");
        });
        document.getElementById("stopSlideBtn").addEventListener('click', () => {
            carouselElem.hidden = true;
        });

        document.getElementById("searchBtn").addEventListener('click', () => {
            if (validateForm(dateElem, roverElem, cameraElem)) {
                imagesCardsElem.innerHTML = `<img src="images/loading-buffering.gif">`;
                getImages(dateElem.value, roverElem.value, cameraElem.value);
            }
        });
        document.getElementById("clearBtn").addEventListener('click', initialForm);
    })
})();