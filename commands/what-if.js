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
		.addUserOption(option => option.setName('government-team-two').setDescription('Second debater on the government team').setRequired(false))
		.addUserOption(option => option.setName('opposition-team-two').setDescription('Second debater on the opposition team').setRequired(false)),
	async execute(interaction) {
		try{
			var gov2 = interaction.options.getUser('government-team-two');
			var opp2 = interaction.options.getUser('opposition-team-two');
	if(gov2 != null && opp2 == null){
		return interaction.reply({ content: "There can't be 3 debaters", ephemeral: true });
	}
	if(gov2 == null && opp2 != null){
		return interaction.reply({ content: "There can't be 3 debaters", ephemeral: true });
	}
	if(gov2 !=null){

		var gov1 = interaction.options.getUser('government-team-one');
		var opp1 = interaction.options.getUser('opposition-team-one');
		var govVotes = interaction.options.getInteger('government-votes');
		var oppVotes = interaction.options.getInteger('opposition-votes');
		var totalVotes = govVotes + oppVotes;
		if(gov1.id == opp1.id || gov1.id == opp2.id || gov2.id == opp1.id || gov2.id == opp2.id || gov1.id == gov2.id||opp1.id == opp2.id){
			return interaction.reply({ content: "You need 4 unique debaters. They can't be the same person.", ephemeral: true });
		}
		var govDB1 = await mongoUsers.findOne({id: gov1.id})
		var oppDB1 = await mongoUsers.findOne({id: opp1.id})
		var govDB2 = await mongoUsers.findOne({id: gov2.id})
		var oppDB2 = await mongoUsers.findOne({id: opp2.id})

		
		if(govDB1 == null || govDB2 == null || oppDB1 == null || oppDB2 == null){
			return interaction.reply({ content: "At least one of these debaters doesn't have a Ranked PDT account", ephemeral: true });
		}
		if(govDB1.deleted || oppDB1.deleted || govDB2.deleted || oppDB2.deleted){
			return interaction.reply({ content: "At least one of these user's accounts has been deleted", ephemeral: true });
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
		var govFullName1 = govDB1.firstName + " " + govDB1.lastName;
		var oppFullName1 = oppDB1.firstName + " " + oppDB1.lastName;
		var govFullName2 = govDB2.firstName + " " + govDB2.lastName;
		var oppFullName2 = oppDB2.firstName + " " + oppDB2.lastName;
		let govArray = [govDB1.lastName, govDB2.lastName]
		govArray.sort()
		let oppArray = [oppDB1.lastName, oppDB2.lastName]
		oppArray.sort()
		if(govArray[0] == govDB1.lastName){
			var govTeamName = govArray[0] + "/" + govArray[1]
			var govTeamPing = "<@" + govDB1.id + ">/<@" + govDB2.id + ">"
			var govChange = false;
			var govDebater1 =  govDB1.firstName + " " + govDB1.lastName;
			var govDebater2 =  govDB2.firstName + " " + govDB2.lastName;
		}else{
			var govTeamName = govArray[0] + "/" + govArray[1]
			var govTeamPing = "<@" + govDB2.id + ">/<@" + govDB1.id + ">"
			var govChange = true;
			var govDebater2 =  govDB1.firstName + " " + govDB1.lastName;
			var govDebater1 =  govDB2.firstName + " " + govDB2.lastName;
		}
		if(oppArray[0] == oppDB1.lastName){
			var oppTeamName = oppArray[0] + "/" + oppArray[1]
			var oppTeamPing = "<@" + oppDB1.id + ">/<@" + oppDB2.id + ">"
			var oppChange = false;
			var oppDebater1 =  oppDB1.firstName + " " + oppDB1.lastName;
			var oppDebater2 =  oppDB2.firstName + " " + oppDB2.lastName;
		}else{
			var oppTeamName = oppArray[0] + "/" + oppArray[1]
			var oppTeamPing = "<@" + oppDB2.id + ">/<@" + oppDB1.id + ">"
			var oppChange = true;
			var oppDebater2 =  oppDB1.firstName + " " + oppDB1.lastName;
			var oppDebater1 =  oppDB2.firstName + " " + oppDB2.lastName;
		}
		var gov_votes = govVotes;
		var opp_votes = oppVotes;
		var R_G1 = govDB1.elo
		var R_G2 = govDB2.elo
		var R_O1 = oppDB1.elo
		var R_O2 = oppDB2.elo
		var R_G = (R_G1+R_G2)/2
		var R_O = (R_O1+R_O2)/2
		var E_G1 = 1/(1+ (Math.pow(10,((R_O - R_G1)/400))))
		var E_G2 = 1/(1+ (Math.pow(10,((R_O - R_G2)/400))))
		var E_O1 = 1/(1+ (Math.pow(10,((R_G - R_O1)/400))))
		var E_O2 = 1/(1+ (Math.pow(10,((R_G - R_O2)/400))))
		var net_votes = gov_votes - opp_votes
		if (net_votes > 0){
			var govWon = true;
			var S_G = Math.pow(1.1, net_votes) - 0.1
			var S_O = net_votes * -0.05
			var winner1 = govDB1.id;
			var winner2 = govDB2.id;
			let sortArray = [govDB1.lastName, govDB2.lastName]
			sortArray.sort()
			var winnerDeclaration = sortArray[0] + "/" +  sortArray[1]
		}else{
			var S_O = Math.pow(1.1, -net_votes) - 0.1
			var S_G = net_votes * 0.05
			var winner1 = oppDB1.id;
			var winner2 = oppDB2.id;
			let sortArray = [oppDB1.lastName, oppDB2.lastName]
			sortArray.sort()
			var winnerDeclaration = sortArray[0] + "/" +  sortArray[1]			}
			var govBoost1 = false;
			var govBoost2 = false;
		if(govDB1.eloBoosts > govDB2.eloBoosts){
			var govEloBooster = govDB1;
			var govBoosterFullName = govFullName1;
			var doGovBoosts = true;
			govBoost1 = true
		}else if(govDB1.eloBoosts < govDB2.eloBoosts){
			var govEloBooster = govDB2;
			var govBoosterFullName = govFullName2;
			var doGovBoosts = true;
			govBoost2 = true
		}else if(govDB1.eloBoosts == 0){
			var doGovBoosts = false;
		}else{
			var doGovBoosts = true;
			if(Math.random()<0.5){
				var govEloBooster = govDB2;
				var govBoosterFullName = govFullName2;
				govBoost2 = true
			}else{
				var govEloBooster = govDB1;
				var govBoosterFullName = govFullName1;
				govBoost1 = true
			}
		}
		var oppBoost1 = false;
		var oppBoost2 = false;
		if(oppDB1.eloBoosts > oppDB2.eloBoosts){
			var oppEloBooster = oppDB1;
			var oppBoosterFullName = oppFullName1;
			var dooppBoosts = true;
			oppBoost1 = true;
		}else if(oppDB1.eloBoosts < oppDB2.eloBoosts){
			var oppEloBooster = oppDB2;
			var oppBoosterFullName = oppFullName2;
			var dooppBoosts = true;
			oppBoost2 = true;
		}else if(oppDB1.eloBoosts == 0){
			var dooppBoosts = false;
		}else{
			var dooppBoosts = true;
			if(Math.random()<0.5){
				var oppEloBooster = oppDB2;
				var oppBoosterFullName = oppFullName2;
				oppBoost2 = true;
			}else{
				var oppEloBooster = oppDB1;
				var oppBoosterFullName = oppFullName1;
				oppBoost1 = true;
			}
		}
    
    if(govWon){
      var govAutoBoost = 1.25;
      var oppAutoBoost = 0.75
    }else{
      var govAutoBoost = 0.75
      var oppAutoBoost = 1.25;
    }
if(doGovBoosts){
			govBoostBoolean = true;
			if(govWon){
				R_G1 = R_G1 + 1.2 * 80*govAutoBoost * (S_G - E_G1)
				R_G2 = R_G2 + 1.2 * 80 *govAutoBoost* (S_G - E_G2)
				var oppWon = false;
			}else{
				R_G1 = R_G1 + 80 *govAutoBoost* (S_G - E_G1)
				R_G2 = R_G2 + 80*govAutoBoost * (S_G - E_G2)
				var oppWon = true;
			}
			var govEloBoost = "\n" +govBoosterFullName  + " used an elo boost."
		}else{
			govBoostBoolean = false;
			R_G1 = R_G1 + 80 *govAutoBoost* (S_G - E_G1)
			R_G2 = R_G2 + 80*govAutoBoost * (S_G - E_G2)
			var govEloBoost = ""
		}

if(dooppBoosts){
oppBoostBoolean = true;
if(oppWon){
	R_O1 = R_O1 + 1.2 * 80*oppAutoBoost * (S_O - E_O1)
	R_O2 = R_O2 + 1.2 * 80 *oppAutoBoost* (S_O - E_O2)
}else{
	R_O1 = R_O1 + 80 *oppAutoBoost* (S_O - E_O1)
	R_O2 = R_O2 + 80 *oppAutoBoost* (S_O - E_O2)
}
var oppEloBoost = "\n" +oppBoosterFullName  + " used an elo boost."
}else{
oppBoostBoolean = false;
R_O1 = R_O1 + 80 *oppAutoBoost* (S_O - E_O1)
R_O2 = R_O2 + 80 *oppAutoBoost* (S_O - E_O2)
var oppEloBoost = ""
}
		if(R_G1 < 0){
			R_G1 = 0;
		}
		if(R_O1 < 0){
			R_O1 = 0;
		}
		if(R_G2 < 0){
			R_G2 = 0;
		}
		if(R_O2 < 0){
			R_O2 = 0;
		}
		var govEloChange1 =R_G1 - govDB1.elo*1
		var govEloChange2 =R_G2 - govDB2.elo*1
		var oppEloChange1 =R_O1 - oppDB1.elo*1
		var oppEloChange2 =R_O2 - oppDB2.elo*1
		var originalGovElo1 = govDB1.elo;
		var originalGovElo2 = govDB2.elo;
		var originalOppElo1 = oppDB1.elo;
		var originalOppElo2 = oppDB2.elo;

						

		if(govEloChange1 > 0){
			var govTeamEmbed = "Team: " + govTeamName + " ("+govTeamPing+")\nVotes: " + govVotes + govEloBoost;
			var govDebaterEmbed1 = "Elo: +"+Math.floor(govEloChange1) + " ["+Math.floor(originalGovElo1)+" ➜ " +Math.floor(R_G1)+"]"
			var govDebaterEmbed2 = "Elo: +"+Math.floor(govEloChange2) + " ["+Math.floor(originalGovElo2)+" ➜ " +Math.floor(R_G2)+"]"
		}else{
			var govTeamEmbed = "Team: " + govTeamName + " ("+govTeamPing+")\nVotes: " + govVotes + govEloBoost;
			var govDebaterEmbed1 = "Elo: "+Math.floor(govEloChange1) + " ["+Math.floor(originalGovElo1)+" ➜ " +Math.floor(R_G1)+"]"
			var govDebaterEmbed2 = "Elo: "+Math.floor(govEloChange2) + " ["+Math.floor(originalGovElo2)+" ➜ " +Math.floor(R_G2)+"]"
		}

		if(govChange){
			let temp = govDebaterEmbed1;
			govDebaterEmbed1 = govDebaterEmbed2;
			govDebaterEmbed2 = temp;
		}
		if(oppEloChange1 > 0){
			var oppTeamEmbed = "Team: " + oppTeamName + " ("+oppTeamPing+")\nVotes: " + oppVotes + oppEloBoost;
			var oppDebaterEmbed1 = "Elo: +"+Math.floor(oppEloChange1) + " ["+Math.floor(originalOppElo1)+" ➜ " +Math.floor(R_O1)+"]"
			var oppDebaterEmbed2 = "Elo: +"+Math.floor(oppEloChange2) + " ["+Math.floor(originalOppElo2)+" ➜ " +Math.floor(R_O2)+"]"
		}else{
			var oppTeamEmbed = "Team: " + oppTeamName + " ("+oppTeamPing+")\nVotes: " + oppVotes + oppEloBoost;
			var oppDebaterEmbed1 = "Elo: "+Math.floor(oppEloChange1) + " ["+Math.floor(originalOppElo1)+" ➜ " +Math.floor(R_O1)+"]"
			var oppDebaterEmbed2 = "Elo: "+Math.floor(oppEloChange2) + " ["+Math.floor(originalOppElo2)+" ➜ " +Math.floor(R_O2)+"]"		}
		if(oppChange){
			let temp = oppDebaterEmbed1;
			oppDebaterEmbed1 = oppDebaterEmbed2;
			oppDebaterEmbed2 = temp;
		}
		const embed = new EmbedBuilder()

	.setTitle("Hypothetical Round Results")
	.addFields(
		{ name: 'Government Team', value: govTeamEmbed, inline: false},
		{ name: govDebater1, value: govDebaterEmbed1, inline: false},
		{ name: govDebater2, value: govDebaterEmbed2, inline: false},
		{ name: 'Opposition Team', value: oppTeamEmbed, inline: false},
		{ name: oppDebater1, value: oppDebaterEmbed1, inline: false},
		{ name: oppDebater2, value: oppDebaterEmbed2, inline: false},
		{ name: 'Winner', value: winnerDeclaration, inline: false},
	)
		return interaction.reply({ embeds: [embed]});		
	}else{
		
		var gov = interaction.options.getUser('government-team-one');
		var opp = interaction.options.getUser('opposition-team-one');
		var govVotes = interaction.options.getInteger('government-votes');
		var oppVotes = interaction.options.getInteger('opposition-votes');
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
		if(govDB.deleted || oppDB.deleted){
			return interaction.reply({ content: "At least one of these user's accounts has been deleted", ephemeral: true });
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
      
    if(govWon){
      var govAutoBoost = 1.25;
      var oppAutoBoost = 0.75
    }else{
      var govAutoBoost = 0.75
      var oppAutoBoost = 1.25;
    }
		if(govDB.eloBoosts > 0){
			if(govWon){
				R_G = R_G + 1.2 * 80*govAutoBoost * (S_G - E_G) 
			}else{
				R_G = R_G + 80 *govAutoBoost* (S_G - E_G) 
			}
			var govEloBoost = "\n Elo boost: 1.2x"
		}else{
			R_G = R_G + 80 *govAutoBoost* (S_G - E_G)
			var govEloBoost = "\n Elo boost: None"
		}
		if(oppDB.eloBoosts > 0){
			if(!govWon){
				R_O = R_O + 1.2*oppAutoBoost * 80 * (S_O - E_O) 
			}else{
				R_O = R_O + 80*oppAutoBoost *(S_O - E_O) 
			}
			var oppEloBoost = "\n Elo boost: 1.2x"
		}else{
			R_O = R_O + 80 * oppAutoBoost*(S_O - E_O)
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
	}
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
