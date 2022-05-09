function buttonalert() {
    alert("ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ");
}

function timereplace() {
    var d = new Date();
    var timeinput = d.toLocaleTimeString().split(":");
    var pretime = `${timeinput[0]}:${timeinput[1]}`
    document.getElementById("time-input").value = pretime;
    document.getElementById("date-input").value = new Date().toISOString().slice(0, 10);
}

function addZero(i) {
    if (i < 10) { i = "0" + i }
    return i;
}

function secondsToTime(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);

    return `${addZero(h)}:${addZero(m)}`
}

function nyssestops(stopinput, timeinput, dateinput, lineinput) {

    const lineregex = lineinput.match(/[\da-zA-Z]+/g);

    let queryamount

    if (lineregex == null) {
        queryamount = "20"
    } else if (lineregex != null) {
        queryamount = "40"
    }

    let cacheoption = document.getElementById("cacheoption").checked;
    localStorage.setItem('cache', cacheoption)

    if (cacheoption == true) {
        localStorage.setItem('stopQuery', addZero(stopinput));
        localStorage.setItem('lineLimit', lineinput);
    }

    let stoprequest
    let querymode
    let timestamp

    let timesplit = timeinput.split(":")
    let datesplit = dateinput.split("-")

    timestamp = Math.round(new Date(datesplit[0], datesplit[1] - 1, datesplit[2], timesplit[0], timesplit[1]).getTime() / 1000)


    switch (isNaN(stopinput)) {
        case false:
            let reqID = stopinput.toString()
            if (reqID.length < 4) {
                reqID = "0".repeat(4 - reqID.length) + reqID
            }
            querymode = "ID";
            stoprequest = `query {
            stop(id: "tampere:${reqID}") {
                name
                gtfsId
                stoptimesWithoutPatterns(numberOfDepartures: ${queryamount}, startTime: ${timestamp}, omitNonPickups: true, timeRange: 10800) {
                    realtimeArrival
                    realtimeDeparture
                    realtime
                    headsign
                    timepoint
                    trip {
                        route {
                            shortName
                            longName
                            }
                        }
                    }      
                }   
            }`;
            break;
        case true:
            querymode = "NAME";
            stoprequest = `query {
            stops(name: "${stopinput}") {
                name
                gtfsId
                lat
                lon
                code
                }     
            }`;
            break;
        default:
            querymode = undefined;
            stoprequest = undefined;
    }

    let stopreq = new XMLHttpRequest();
    stopreq.open("POST", "https://api.digitransit.fi/routing/v1/routers/waltti/index/graphql");
    stopreq.setRequestHeader("Content-Type", "application/json");
    var finalquery = JSON.stringify({ "query": stoprequest })

    stopreq.send(finalquery);

    stopreq.onload = () => {
        stopreq.responseText;
        const stopJSON = JSON.parse(stopreq.responseText);

        if (querymode == "ID") {
            var element = document.getElementById("timetablediv");
            if (typeof (element) != 'undefined' && element != null) {
                var resultdiv = document.getElementById("timetablediv");
            } else {
                var resultdiv = document.createElement("div");
            }
            resultdiv.setAttribute("id", "timetablediv")
            resultdiv.setAttribute("class", "textdiv")
            let htmlcontent = ""
            if (stopJSON["data"]["stop"] != null) {
                htmlcontent += `<strong>${stopJSON["data"]["stop"]["name"]}</strong><br><br>`
                let arrivalJSON = stopJSON["data"]["stop"]["stoptimesWithoutPatterns"];
                for (const busJSON in arrivalJSON) {
                    let base = arrivalJSON[busJSON];
                    let destination = base["headsign"];
                    let line = base["trip"]["route"]["shortName"];
                    let timepoint = base["timepoint"];

                    function secondformatter(sec) {
                        if (sec > 86400) { sec = sec - 86400 }
                        return sec;
                    }

                    let arrtime = secondsToTime(secondformatter(base["realtimeArrival"]))
                    let deptime = secondsToTime(secondformatter(base["realtimeDeparture"]))

                    if (lineregex == null) {
                        htmlcontent += `${line} ${destination}<br>${arrtime} → ${deptime}<br><br>`;
                    } else if (lineregex != null) {
                        if (lineregex.includes(line)) {
                            htmlcontent += `${line} ${destination}<br>${arrtime} → ${deptime}<br><br>`;
                        }
                    }
                }
            } else {
                htmlcontent = "That stop doesn't exist.";
            }
            resultdiv.innerHTML = htmlcontent;
            document.body.appendChild(resultdiv);

        } else if (querymode == "NAME") {
            var element = document.getElementById("timetablediv");
            if (typeof (element) != 'undefined' && element != null) {
                var resultdiv = document.getElementById("timetablediv");
            } else {
                var resultdiv = document.createElement("div");
            }
            resultdiv.setAttribute("id", "timetablediv");
            resultdiv.setAttribute("class", "textdiv");
            let htmlcontent = ""

            if (stopJSON["data"]["stops"].length > 0) {
                for (const stopOBJ in stopJSON["data"]["stops"]) {
                    if (stopJSON["data"]["stops"][stopOBJ]["gtfsId"].includes("tampere")) {
                        let stopid = stopJSON["data"]["stops"][stopOBJ]["code"].toString()
                        htmlcontent += `Name: ${stopJSON["data"]["stops"][stopOBJ]["name"]}<br>ID: ${stopid}<br><br>`;
                        htmlcontent += `<button onclick = "nyssestops(${stopid}, document.getElementById('time-input').value, document.getElementById('date-input').value, document.getElementById('line-input').value)" value="submit" class="selectbutton">Choose stop</button><br><br>`;
                    }
                }
                if (htmlcontent.length == 0) {
                    htmlcontent += "No results found.";
                }
            } else {
                htmlcontent = "No results found.";
            }
            resultdiv.innerHTML = htmlcontent;
            document.body.appendChild(resultdiv);

        }

    }

}


function trainstops() {
    let stationrequest

    stationrequest = `{
        stations(where: {passengerTraffic: {equals: true}}) {
          shortCode
          name
          passengerTraffic
        }
    }`

    let stationXHR = new XMLHttpRequest();
    stationXHR.open("POST", "https://rata.digitraffic.fi/api/v2/graphql/graphql");
    stationXHR.setRequestHeader("Content-Type", "application/json");
    var finalXHR = JSON.stringify({ "query": stationrequest })

    stationXHR.send(finalXHR);

    stationXHR.onload = () => {
        stationXHR.responseText;
        const stationJSON = JSON.parse(stationXHR.responseText);

        var element1 = document.getElementById("selector1");
        var element2 = document.getElementById("selector2");


        for (stops in stationJSON['data']['stations']) {
            var option = document.createElement("option");
            option.text = `${stationJSON['data']['stations'][stops]['name']}`.replace("_", " ");
            option.value = stationJSON['data']['stations'][stops]['shortCode']
            element1.add(option)
        }
        for (stops in stationJSON['data']['stations']) {
            var option = document.createElement("option");
            option.text = `${stationJSON['data']['stations'][stops]['name']}`.replace("_", " ");
            option.value = stationJSON['data']['stations'][stops]['shortCode']
            element2.add(option)
        }
    }
}

async function ticketsearch(depstation, arrstation, passengertype, timeip, dateip, e) {
    const object = {
        "operationName": "searchSingleTickets",
        "variables": {
            "hoursIntoNextDay": 0,
            "showDepartedJourneys": false,
            "departure": depstation,
            "arrival": arrstation,
            "date": dateip,
            "passengers": [
                {
                    "key": "Ör.eu",
                    "type": passengertype,
                    "wheelchair": false,
                    "vehicles": [

                    ]
                }
            ],
            "multiTicketBookingId": null,
            "filters": [

            ],
            "placeTypes": [
                "SEAT",
                "CABIN_BED"
            ]
        },
        "query": "fragment GaOrder on GAOrder {\n  products {\n    id\n    type\n    category\n    quantity\n    price\n    passengerType\n    departureStation\n    arrivalStation\n    trainLabel\n    trainNumber\n    tax\n    __typename\n  }\n  passengers {\n    passengerType\n    additionalServices {\n      id\n      name\n      quantity\n      sumPrice\n      __typename\n    }\n    __typename\n  }\n  journey {\n    additionalServices {\n      id\n      name\n      quantity\n      sumPrice\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nquery searchSingleTickets($departure: String!, $arrival: String!, $date: Date!, $passengers: [PassengerInput!]!, $hoursIntoNextDay: Int = 4, $showDepartedJourneys: Boolean = true, $multiTicketBookingId: String, $filters: [ConnectionFilter]!, $placeTypes: [PlaceType!]!) {\n  searchSingleTickets(departure: $departure, arrival: $arrival, date: $date, passengers: $passengers, hoursIntoNextDay: $hoursIntoNextDay, showDepartedJourneys: $showDepartedJourneys, multiTicketBookingId: $multiTicketBookingId, filters: $filters, placeTypes: $placeTypes) {\n    ... on NoConnections {\n      noConnectionsReason\n      __typename\n    }\n    ... on ConnectionOfferList {\n      items {\n        connection {\n          id\n          duration\n          transferCount\n          departure {\n            station\n            time\n            __typename\n          }\n          services\n          rampServiceRequiredForStations\n          isCoronaTestRecommended\n          arrival {\n            station\n            time\n            __typename\n          }\n          legs {\n            id\n            services\n            departure {\n              station\n              time\n              __typename\n            }\n            arrival {\n              station\n              time\n              __typename\n            }\n            duration\n            train {\n              id\n              type\n              label\n              __typename\n            }\n            stops {\n              station\n              arrivalTime\n              departureTime\n              __typename\n            }\n            __typename\n          }\n          __typename\n        }\n        seatAvailability\n        accessibleSeatAvailability\n        petSeatAvailability\n        cabinAvailability\n        petCabinAvailability\n        accessibleCabinAvailability\n        offer {\n          ... on Offer {\n            id\n            price\n            gaOrder {\n              ...GaOrder\n              __typename\n            }\n            __typename\n          }\n          ... on NoOffer {\n            noOfferReason\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n"
    };

    const response = await fetch('https://www.vr.fi/api/v4', {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify(object),
        headers: {
            'Content-Type': 'application/json',
            'origin': 'https://xn--r-0ga.eu',
            'referer': 'https://xn--r-0ga.eu'
        }
    });
    const responseText = await response.json();

    var trips = responseText['data']['searchSingleTickets']['items'];
    var htmlcontent = "";

    var stationrequest = `{
        stations(where: {passengerTraffic: {equals: true}}) {
          shortCode
          name
          passengerTraffic
        }
    }`
    
    const stations = await fetch('https://rata.digitraffic.fi/api/v2/graphql/graphql', {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({"query": stationrequest}),
        headers: {
            'Content-Type': 'application/json',
            'origin': 'https://xn--r-0ga.eu',
            'referer': 'https://xn--r-0ga.eu'
        }
    });
    const stationJSON = await stations.json();

    const stationOBJ = {};

    for (let station in stationJSON['data']['stations']) {
        stationOBJ[stationJSON['data']['stations'][station]['shortCode']] = stationJSON['data']['stations'][station]['name'].replace("_"," ")
    }

    let leghtml = "";

    for (let trip in trips) {
        let price = `${trips[trip]['offer']['price']/100} €`.replace(".",",");
        leghtml = `<div class="routediv"><div class="textdiv">${price}</div>`;
        for (let legs in trips[trip]['connection']['legs']) {
            let leg = trips[trip]['connection']['legs'][legs];
            leghtml += `<div class="textdiv">`
            leghtml += `${leg['train']['type']} ${leg['train']['label']}<br>`.replace("LOL", "Lähijuna");
            leghtml += `${stationOBJ[leg['departure']['station']]} → ${stationOBJ[leg['arrival']['station']]}<br>`
            leghtml += `${leg['departure']['time'].split("T")[1].slice(0,5)} → ${leg['arrival']['time'].split("T")[1].slice(0,5)} (${secondsToTime(leg['duration'])})<br></div>`;
        }
        leghtml += "</div>";
        let time = trips[trip]['connection']['departure']['time'].split("T")[1].slice(0,5); 
        if ((time.split(":")[0] >= timeip.split(":")[0])) {
            if ((time.split(":")[0] > timeip.split(":")[0])) {
                htmlcontent += leghtml;
            } else if((time.split(":")[1] >= timeip.split(":")[1])) {
                htmlcontent += leghtml;
            }  
        }
    }
    if (responseText['data']['searchSingleTickets']['__typename'] != "NoConnections") {
        ticketdiv(htmlcontent);
    } else {
        htmlcontent = "No connections found!"
        ticketdiv(htmlcontent)
    }
    
}

function ticketdiv(htmlcontent) {
    var element = document.getElementById("timetablediv");
    if (typeof (element) != 'undefined' && element != null) {
        var resultdiv = document.getElementById("timetablediv");
    } else {
        var resultdiv = document.createElement("div");
    }
    resultdiv.setAttribute("id", "timetablediv")
    resultdiv.setAttribute("class", "textdiv")

    resultdiv.innerHTML = htmlcontent;
    document.body.appendChild(resultdiv);
}
