const { SlashCommandBuilder } = require('discord.js');
const {  ActionRowBuilder, ButtonBuilder, ButtonStyle, Events , EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");
const mongoRounds = mongoclient.db("RankedPDT").collection("rounds");

module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('View the leaderboard (sorted by elo)'),
	async execute(interaction) {
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

async function sendLeaderboard(message, page) {
	const leaderboardData = "Page";
	const embed = new EmbedBuilder()
	  .setTitle(`Leaderboard (Page ${page})`)
	  .setDescription(leaderboardData);
	  if(page == 1){

		var newRow = new ActionRowBuilder()
		.addComponents(
		  new ButtonBuilder()
			.setCustomId('left')
			.setEmoji('◀️')			
			.setStyle(ButtonStyle.Primary)
			.setDisabled(true),
		  new ButtonBuilder()
			.setCustomId('right')
			.setEmoji('▶️')			
			.setStyle(ButtonStyle.Primary)
			);
	  }else{
		var newRow = new ActionRowBuilder()
		.addComponents(
		  new ButtonBuilder()
			.setCustomId('left')
			.setEmoji('◀️')			
			.setStyle(ButtonStyle.Primary),
		  new ButtonBuilder()
			.setCustomId('right')
			.setEmoji('▶️')			
			.setStyle(ButtonStyle.Primary)
			);
	  }
	  await interaction.editReply({ embeds: [embed], components: [newRow] });
	const filter = i => i.user.id === message.user.id;
	const collector = message.channel.createMessageComponentCollector({ filter, time: 15000 });
	collector.on('collect', async i => {
	  if (i.customId === 'left') {
		page--;
	  } else if (i.customId === 'right') {
		page++;
	  }
	  await sendLeaderboard(message, page);
	 });
  }

		if(eloArray.length > 2){
			var numberOfPages = Math.ceil(eloArray.length/10);
			var row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
				.setCustomId('left')
				.setStyle(ButtonStyle.Primary)
				.setEmoji('◀️')			
				.setDisabled(true),
				new ButtonBuilder()
				.setCustomId('right')
				.setStyle(ButtonStyle.Primary)
				.setEmoji('▶️')			
			);
		const embed = new EmbedBuilder()
		.setColor(0x0099FF)
		.setTitle("Page 1")

		interaction.reply({ embeds: [embed], components: [row] });
		//create verification embed that only has some information, then ping otherDebaterID to see if they can confirm
		//if they do confirm, then send the next message saying pog
		//if they don't confirm, then automatically submit the results of the round anyways
		const filter = i => i.customId === 'right' && i.user.id === interaction.user.id;
		
		const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
		
		collector.on('collect', async i => {
			sendLeaderboard(interaction, 2)
		});


return collector.on('end', collected => console.log(`Collected ${collected.size} items`));

		}else{
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
					}else{
						line = i + ". " +Math.floor(eloArray[i-1]) + " - " + nameArray[i-1] + " (<@" + idArray[i-1] + ">)"
						prevRanking = i;
					}
				}
				prevElo = eloArray[i-1]	
	
				if((i)== eloArray.length){
					embededContent = embededContent+ line;
				}else{
					embededContent = embededContent+  line + "\n";
				}
			}
		}
		const embed = new EmbedBuilder()
		.setColor(0x0099FF)
		.setTitle("Elo Leaderboard")
		.setDescription(embededContent)

		return interaction.reply({ embeds: [embed], components: [row] });
	},
};
