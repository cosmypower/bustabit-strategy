// ==UserScript==
// @name         Bustabit strategy
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       CosMy
// @match        https://www.bustabit.com/play
// @grant        none
// @require http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

var rounds_list = [];
var lose_bets = [];
var bet_start_value = 25;

var round_started = true;
var has_bet = false;

var cooldown = 0;

/* main round callbacks */
function OnStartRound() {
    round_started = true;

    wait_for_end_round(OnEndRound);
}

function OnEndRound() {
    var m_last_multiplier = get_last_multiplier();
    rounds_list.push(m_last_multiplier);
    console.log(`[INFO] Crashed at: ${m_last_multiplier}`);

    if (cooldown) cooldown--;

    if (has_bet && m_last_multiplier > 3.00) OnRoundWin();
    if (has_bet && m_last_multiplier < 3.00) OnRoundLose();
    if (!has_bet && cooldown == 0) OnRoundCanBet();

    setTimeout(OnStartRound, 5000);
}

$(document).ready(function() {
    wait_for_multipliers(function(last_multiplier) {
        console.log(`[INFO] Last multiplier: ${last_multiplier}`);

        wait_for_end_round(OnEndRound);
    });
});

/* round end callbacks */
function OnRoundCanBet() {
    bet(bet_start_value);

    lose_bets.push(bet_start_value);
    console.log("[INFO] Playing this round.. bet value: " + bet_start_value);
}

function OnRoundWin() {
    console.log("Won this round...! Profit: " + (lose_bets[lose_bets.length - 1] * 3));

    lose_bets = [];
    cooldown = 2;
    has_bet = false;
}

function OnRoundLose() {
    lose_bets.push(lose_bets[lose_bets.length > 0 ? lose_bets.length - 1 : 0]);

    get_reds_streak((rounds) => {
        let bet_value = 0;

        if (lose_bets.length > 1) bet_value = lose_bets[lose_bets.length - 2] + lose_bets[lose_bets.length - 1];
        else bet_value = lose_bets[0];
    
        console.log("[INFO] Lost this round! Betting value: " + bet_value + " | " + lose_bets.length);
        console.log(rounds);
        
        bet(bet_value);
    }, 5);
}


/* functions */
function get_reds_streak(_cb, number_of_rounds) {
    let array_length = (rounds_list.length > number_of_rounds ? number_of_rounds : rounds_list.length);

    var red_streaks = [];
    for (let i = 0; i < array_length; i++) {
        const element = rounds_list[rounds_list.length - i];

        if (element < 3.00) red_streaks.push(element);
        else red_streaks = [];

        if (i == array_length - 1) {
            _cb(red_streaks);

            red_streaks = [];
        }
    }
}

function wait_for_end_round(_callback) {
    var k = setInterval(() => {
        if (get_round_total_players() == 0) {
            _callback();

            clearInterval(k);
        }
    }, 1);
}

function wait_for_multipliers(_callback)
{
    var k = setInterval(() => {

        if(get_last_multiplier() > 0)
        {
            _callback(get_last_multiplier());

            clearInterval(k);
        }

    }, 1);
}

function bet(bits) {
    has_bet = true;

    $("#root > div:nth-child(1) > div > div._betControls_1bcte_32 > div > div._betFormContainer_1np5g_18 > form > div._wagerInput_1np5g_66._hasError_1ak4w_18.form-group > div > input").val(bits);

    setTimeout(() => { $("#root > div:nth-child(1) > div > div._betControls_1bcte_32 > div > div._betFormContainer_1np5g_18 > form > button > div").click(); }, 1000);
}

function get_round_total_players()
{
    return parseInt($('#root > div:nth-child(1) > div > div._rightPanel_1bcte_32 > div._container_93izl_1 > div > table > tbody > tr > td:nth-child(2)').text().split(" ")[1].replace(",", ""));
}

function get_round_total_bits()
{
    return parseInt($("#root > div:nth-child(1) > div > div._rightPanel_1bcte_32 > div._container_93izl_1 > div > table > tbody > tr > td:nth-child(3)").text().split(" ")[1].replace(",", ""));
}

function get_last_multiplier()
{
    return parseFloat($('#root > div:nth-child(1) > div > div._gameDisplay_1bcte_32 > div._previousCrashes_wxzdk_18 > div > table > tbody > tr > td:nth-child(1) > a').text());
}