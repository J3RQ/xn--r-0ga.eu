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

function nyssestops(stopinput, timeinput, dateinput, lineinput) {

    const lineregex = lineinput.match(/[\da-zA-Z]+/g);

    let queryamount

    if (lineregex == null) {
        queryamount = "20"
    } else if (lineregex != null) {
        queryamount = "40"
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

        function secondsToTime(d) {
            d = Number(d);
            var h = Math.floor(d / 3600);
            var m = Math.floor(d % 3600 / 60);

            function addZero(i) {
                if (i < 10) { i = "0" + i }
                return i;
            }

            return `${addZero(h)}:${addZero(m)}`
        }


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
                        htmlcontent += `Line: ${line}<br>Destination: ${destination}<br>Arrival: ${arrtime}<br>Departure: ${deptime}<br><br>`;
                    } else if (lineregex != null) {
                        if (lineregex.includes(line)) {
                            htmlcontent += `Line: ${line}<br>Destination: ${destination}<br>Arrival: ${arrtime}<br>Departure: ${deptime}<br><br>`;
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
