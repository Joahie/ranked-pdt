const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");
const mongoRounds = mongoclient.db("RankedPDT").collection("rounds");

module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Report a round that you debated in/judged to update elo')
		.addUserOption(option => option.setName('government-team').setDescription('Debater on the government team').setRequired(true))
		.addUserOption(option => option.setName('opposition-team').setDescription('Debater on the opposition team').setRequired(true))
		.addIntegerOption(option => option.setName('government-votes').setDescription('Number of judges who voted government').setRequired(true))
		.addIntegerOption(option => option.setName('opposition-votes').setDescription('Number of judges who voted opposition').setRequired(true))
		.addStringOption(option => option.setName('resolution').setDescription('The resolution that was debated').setRequired(true)),
	async execute(interaction) {
		if(interaction.channel.id != 1085212287603843185){
			return interaction.reply({ content: "Commands only work in <#1085212287603843185>", ephemeral: true });
		}		
		var gov = interaction.options.getUser('government-team');
		var opp = interaction.options.getUser('opposition-team');
		var govVotes = interaction.options.getInteger('government-votes');
		var oppVotes = interaction.options.getInteger('opposition-votes');
		var resolution = interaction.options.getString('resolution');
		var totalVotes = govVotes + oppVotes;
		if(gov.id == opp.id){
			return interaction.reply({ content: "The government and opposition teams cannot be the same user", ephemeral: true });
		}
		var govDB = await mongoUsers.findOne({id: gov.id})
		var oppDB = await mongoUsers.findOne({id: opp.id})
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
		oppVotes = oppVotes + ""
		govVotes = govVotes + ""
		var temp = await mongoRounds.findOne({id: "Count"});
		var amountOfRounds = temp.count*1
		var roundID = ("0000" + amountOfRounds).slice(-5);
		var newCount = amountOfRounds + 1
		var govFullName = govDB.firstName + " " + govDB.lastName;
		var oppFullName = oppDB.firstName + " " + oppDB.lastName;
		const d = new Date();
		const month = d.getMonth() + 1
		const dateFormatted = month + "/" + d.getDate() + "/" + d.getFullYear();

		var gov_votes = govVotes;
		var opp_votes = oppVotes;
		var R_G = govDB.elo*1
		var R_O = oppDB.elo*1
		console.log(R_G)
		console.log(R_O)
		var E_G = 1/(1+ (Math.pow(10,((R_O - R_G)/400))))
		var E_O = 1/(1+ (Math.pow(10,((R_G - R_O)/400))))
		console.log(E_G)
		console.log(E_O)
		var net_votes = gov_votes - opp_votes
		if (net_votes > 0){
			var S_G = Math.pow(1.1, net_votes) - 0.1
			var S_O = net_votes * -0.05
			var winner = govDB.id;
			var winnerDeclaration = govFullName + " (<@" + gov.id+">)"
		}else{
			var S_O = Math.pow(1.1, net_votes) - 0.1
			var S_G = net_votes * 0.05
			var winner = oppDB.id;
			var winnerDeclaration = oppFullName + " (<@" + opp.id+">)"
		}

		console.log(S_G)
		console.log(S_O)
		R_G = R_G + 80 * (S_G - E_G) 
		R_O = R_O + 80 * (S_O - E_O)
		console.log(R_G)
		console.log(R_O)
		var govEloChange =R_G- govDB.elo*1
		var oppEloChange = R_O - oppDB.elo*1
		console.log(govEloChange)
		console.log(oppEloChange)
		var originalGovElo = govDB.elo;
		var originalOppElo = oppDB.elo;
		await mongoRounds.insertOne({id: roundID, govDebater: gov.id, oppDebater: opp.id, govVotes: govVotes, oppVotes: oppVotes, resolution: resolution, date: dateFormatted, govElo: R_G,oppElo: R_O,govEloChange: govEloChange, oppEloChange: oppEloChange, winner: winner})
		await mongoRounds.updateOne({id: "Count"},{$set:{count: newCount}})
		if(gov_votes > opp_votes){
			var newGovWins = govDB.wins*1 + 1
			var newOppWins = oppDB.wins*1 - 1
		}else{
			var newGovWins = govDB.wins*1 - 1
			var newOppWins = oppDB.wins*1 + 1
		}
		await mongoUsers.updateOne({id: govDB.id},{$set:{elo: R_G, wins: newGovWins}})
		await mongoUsers.updateOne({id: oppDB.id},{$set:{elo: R_O, wins: newOppWins}})
		if(govEloChange > 0){
			var govTeamEmbed = "Debater: " + govFullName + " (<@"+gov.id+">)\nVotes: " + govVotes + "\nElo: +"+Math.round(govEloChange) + " ["+Math.round(originalGovElo)+" ➜ " +Math.round(R_G)+"]";
		}else{
			var govTeamEmbed = "Debater: " + govFullName + " (<@"+gov.id+">)\nVotes: " + govVotes + "\nElo: "+Math.round(govEloChange) + " ["+Math.round(originalGovElo)+" ➜ " +Math.round(R_G)+"]";
		}
		if(oppEloChange > 0){
			var oppTeamEmbed = "Debater: " + oppFullName + "(<@"+opp.id+">)\nVotes: " + oppVotes + "\nElo: +"+Math.round(oppEloChange) + " ["+Math.round(originalOppElo)+" ➜ " +Math.round(R_O)+"]";
		}else{
			var oppTeamEmbed = "Debater: " + oppFullName + "(<@"+opp.id+">)\nVotes: " + oppVotes + "\nElo: "+Math.round(oppEloChange) + " ["+Math.round(originalOppElo)+" ➜ " +Math.round(R_O)+"]";
		}
		const embed = new EmbedBuilder()

	.setColor(0x0099FF)
	.setTitle("Round #" + roundID)
	.setDescription('Resolution: ' + resolution)
	.addFields(
		{ name: 'Government Team', value: govTeamEmbed, inline: false},
		{ name: 'Opposition Team', value: oppTeamEmbed, inline: false},
		{ name: 'Winner ', value: winnerDeclaration, inline: false},//update wins on profiles
	)
		return interaction.reply({ embeds: [embed] });
	},
};
