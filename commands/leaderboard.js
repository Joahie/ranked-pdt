const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");
const mongoRounds = mongoclient.db("RankedPDT").collection("rounds");

module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('View the leaderboard (based on elo)')
		.addIntegerOption(option => option.setName('page').setDescription("The page of the leaderboard that you'd like to view")),
	async execute(interaction) {
			
		var leaderboardPage = interaction.options.getInteger('page');
		const count = await mongoUsers.count();
		var pages = Math.ceil(count/10)
		if(pages < leaderboardPage){ 
			if(pages > 1){
				return interaction.reply({ content: "There are only " + pages + " pages on the leaderboard", ephemeral: true });
			}else if(pages == 1){
				return interaction.reply({ content: "There is only 1 page of the leaderboard", ephemeral: true });

			}
		}

		const results = await mongoUsers.find({}).toArray();
		var eloArray = [];
		var nameArray = [];
		var idArray = [];
		for(i = 0; i<results.length; i++){
			eloArray.push(results[i].elo)
			idArray.push(results[i].id)
			var fullName = results[i].firstName + " " + results[i].lastName;
			nameArray.push(fullName)
		}

		function quickSortThreeArraysDescending(arr1, arr2, arr3) {
			if (arr1.length <= 1) {
				return [arr1, arr2, arr3];
			}
			let pivotIndex = arr1.length - 1;
			let pivot = arr1[pivotIndex];
			let left1 = [];
			let left2 = [];
			let left3 = [];
			let right1 = [];
			let right2 = [];
			let right3 = [];
			
			for (let i = 0; i < pivotIndex; i++) {
				if (arr1[i] > pivot) {
					left1.push(arr1[i]);
					left2.push(arr2[i]);
					left3.push(arr3[i]);
				} else {
					right1.push(arr1[i]);
					right2.push(arr2[i]);
					right3.push(arr3[i]);
				}
			}
			
			let sortedLeftArrays = quickSortThreeArraysDescending(left1, left2, left3);
			let sortedRightArrays = quickSortThreeArraysDescending(right1, right2, right3);
			
			return [
				[...sortedLeftArrays[0], pivot, ...sortedRightArrays[0]],
				[...sortedLeftArrays[1], arr2[pivotIndex], ...sortedRightArrays[1]],
				[...sortedLeftArrays[2], arr3[pivotIndex], ...sortedRightArrays[2]]
			];
		}

		sortedArrays = quickSortThreeArraysDescending(eloArray, idArray, nameArray)
		eloArray = sortedArrays[0]
		idArray = sortedArrays[1]
		nameArray = sortedArrays[2]
		var line;
		var embededContent = ""
		var prevRanking;
		var prevElo;

		for(i = 1; i <= eloArray.length; i++){
			if(i == 1){
				line = i + ". " +Math.floor(eloArray[i-1]) + " - " + nameArray[i-1] + " (<@" + idArray[i-1] + ">)"
				prevRanking = i;
			}else{
				if(prevElo == eloArray[i-1]){
					line = prevRanking + ". " +Math.floor(eloArray[i-1]) + " - " + nameArray[i-1] + " (<@" + idArray[i-1] + ">)"
					if(interaction.user.id == idArray[i-1]){
						var ranking = prevRanking;
					}
				}else{
					line = i + ". " +Math.floor(eloArray[i-1]) + " - " + nameArray[i-1] + " (<@" + idArray[i-1] + ">)"
					prevRanking = i;
					if(interaction.user.id == idArray[i-1]){
						var ranking = i;
					}
				}
			}
			prevElo = eloArray[i-1]	

			if((i)== eloArray.length){
				embededContent = embededContent+ line;
			}else{
				embededContent = embededContent+  line + "\n";
			}
		}
		if(ranking){
			var rankString = "Your position: #" + ranking + " - "
		}else{
			var rankString = ""
		}
		if(leaderboardPage == null){
			leaderboardPage = 1
		}
		var embed = new EmbedBuilder()
	.setColor(0x0099FF)
	.setTitle("Elo Leaderboard")
	.setDescription(embededContent)
	.setFooter({ text: rankString + 'Page ' + leaderboardPage + " of " + pages});
		return interaction.reply({ embeds: [embed] });
	},

};