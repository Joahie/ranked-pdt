const { SlashCommandBuilder } = require('discord.js');
const {  EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");
module.exports = {
	data: new SlashCommandBuilder()
		.setName('what-if')
		.setDescription("Tells debaters the change in elo that would occur based off of the results of a hypothetical round")
		.addUserOption(option => option.setName('government-team-one').setDescription('First debater on the government team').setRequired(true))
		.addUserOption(option => option.setName('opposition-team-one').setDescription('First debater on the opposition team').setRequired(true))
		.addIntegerOption(option => option.setName('government-votes').setDescription('Number of judges who voted government').setRequired(true))
		.addIntegerOption(option => option.setName('opposition-votes').setDescription('Number of judges who voted opposition').setRequired(true))
		.addUserOption(option => option.setName('government-team-two').setDescription('Second debater on the government team').setRequired(true))
		.addUserOption(option => option.setName('opposition-team-two').setDescription('Second debater on the opposition team').setRequired(true)),
	async execute(interaction) {
		try{
		var gov = interaction.options.getUser('government-team');
		var opp = interaction.options.getUser('opposition-team');
		var govVotes = interaction.options.getInteger('government-votes');
		var oppVotes = interaction.options.getInteger('opposition-votes');
		var totalVotes = govVotes + oppVotes;
		if(gov.id == opp.id){
			return interaction.reply({ content: "The government and opposition teams cannot be the same user", ephemeral: true });
		}
		var govDB = await mongoUsers.findOne({id: gov.id})
		var oppDB = await mongoUsers.findOne({id: opp.id})
		if(govDB.deleted || oppDB.deleted){
			return interaction.reply({ content: "At least one of these user's accounts has been deleted", ephemeral: true });
		
		}
		if(govDB == null && oppDB == null){
			return interaction.reply({ content: gov.username  + " and " + opp.username + " don't have Ranked PDT accounts", ephemeral: true });
		}
		if(govDB == null){
			return interaction.reply({ content: gov.username + " doesn't have a Ranked PDT account", ephemeral: true });
		}
		if(oppDB == null){
			return interaction.reply({ content: opp.username + " doesn't have a Ranked PDT account", ephemeral: true });
		}
		if(govVotes < 0 || oppVotes < 0){
			return interaction.reply({ content: "You can't have a negative number of votes for a team", ephemeral: true });
		}
		if((totalVotes % 2) != 1){
			return interaction.reply({ content: "The total number of judges needs to be odd", ephemeral: true });
		}

		if(totalVotes > 5){
			return interaction.reply({ content: "You can't have more than 5 judges for a round", ephemeral: true });
		}
		oppVotes = oppVotes + ""
		govVotes = govVotes + ""
		var govFullName = govDB.firstName + " " + govDB.lastName;
		var oppFullName = oppDB.firstName + " " + oppDB.lastName;
		var gov_votes = govVotes;
		var opp_votes = oppVotes;
		var R_G = govDB.elo*1
		var R_O = oppDB.elo*1
		var E_G = 1/(1+ (Math.pow(10,((R_O - R_G)/400))))
		var E_O = 1/(1+ (Math.pow(10,((R_G - R_O)/400))))
		console.log(E_G)
		console.log(E_O)
		var net_votes = gov_votes - opp_votes
		if (net_votes > 0){
			var govWon = true;
			var S_G = Math.pow(1.1, net_votes) - 0.1
			var S_O = net_votes * -0.05
			var winner = govDB.id;
			var winnerDeclaration = govFullName + " (<@" + gov.id+">)"
		}else{
			var S_O = Math.pow(1.1, -net_votes) - 0.1
			var S_G = net_votes * 0.05
			var winner = oppDB.id;
			var winnerDeclaration = oppFullName + " (<@" + opp.id+">)"
		}
		if(govDB.eloBoosts > 0){
			if(govWon){
				R_G = R_G + 1.2 * 80 * (S_G - E_G) 
			}else{
				R_G = R_G + 80 * (S_G - E_G) 
			}
			var govEloBoost = "\n Elo boost: 1.2x"
		}else{
			R_G = R_G + 80 * (S_G - E_G)
			var govEloBoost = "\n Elo boost: None"
		}
		if(oppDB.eloBoosts > 0){
			if(!govWon){
				R_O = R_O + 1.2 * 80 * (S_O - E_O) 
			}else{
				R_O = R_O + 80 * (S_O - E_O) 
			}
			var oppEloBoost = "\n Elo boost: 1.2x"
		}else{
			R_O = R_O + 80 * (S_O - E_O)
			var oppEloBoost = "\n Elo boost: None"
		}
		if(R_G < 0){
			R_G = 0;
		}
		if(R_O < 0){
			R_O = 0;
		}
		var govEloChange =R_G- govDB.elo*1
		var oppEloChange = R_O - oppDB.elo*1
		var originalGovElo = govDB.elo;
		var originalOppElo = oppDB.elo;

		if(govEloChange > 0){
			var govTeamEmbed = "Debater: " + govFullName + " (<@"+gov.id+">)\nVotes: " + govVotes + "\nElo: +"+Math.floor(govEloChange) + " ["+Math.floor(originalGovElo)+" ➜ " +Math.floor(R_G)+"]" + govEloBoost;
		}else{
			var govTeamEmbed = "Debater: " + govFullName + " (<@"+gov.id+">)\nVotes: " + govVotes + "\nElo: "+Math.floor(govEloChange) + " ["+Math.floor(originalGovElo)+" ➜ " +Math.floor(R_G)+"]" + govEloBoost;
		}
		if(oppEloChange > 0){
			var oppTeamEmbed = "Debater: " + oppFullName + " (<@"+opp.id+">)\nVotes: " + oppVotes + "\nElo: +"+Math.floor(oppEloChange) + " ["+Math.floor(originalOppElo)+" ➜ " +Math.floor(R_O)+"]" + oppEloBoost;
		}else{
			var oppTeamEmbed = "Debater: " + oppFullName + " (<@"+opp.id+">)\nVotes: " + oppVotes + "\nElo: "+Math.floor(oppEloChange) + " ["+Math.floor(originalOppElo)+" ➜ " +Math.floor(R_O)+"]" + oppEloBoost;
		}

		const embed = new EmbedBuilder()

	.setTitle("Hypothetical Round Results")
	.addFields(
		{ name: 'Government Team', value: govTeamEmbed, inline: false},
		{ name: 'Opposition Team', value: oppTeamEmbed, inline: false},
		{ name: 'Winner', value: winnerDeclaration, inline: false},
	)
		return interaction.reply({ embeds: [embed]});		
	} catch (error) {
		console.error(error);
var today = new Date();
var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
var dateTime = date+' '+time;

console.log("Date: " + dateTime)
console.log("User ID:" + interaction.user.id)
				  return interaction.reply({ content: 'There was an error while executing this command!'});

}
	},
};
