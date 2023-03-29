const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");

module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('register')
		.setDescription('Create your Ranked PDT Profile')
		.addStringOption(option => option.setName('first-name').setDescription('Name for profile').setRequired(true))
		.addStringOption(option => option.setName('last-name').setDescription('Name for profile').setRequired(true))
		.addStringOption(option => option.setName('club').setDescription('Debate club for profile').setRequired(true))
		.addStringOption(option => option.setName('state').setDescription('State for profile').setRequired(true)),
	async execute(interaction) {
		try{
		
		const results = await mongoUsers.findOne({id: interaction.user.id})
		if(results != null){
			return interaction.reply({ content: "You already have a Ranked PDT account", ephemeral: true });
		}
		const firstName = interaction.options.getString('first-name');
		const lastName = interaction.options.getString('last-name');
		const name = firstName + " " + lastName;
		const club = interaction.options.getString('club');
		const state = interaction.options.getString('state');
		const d = new Date();
		const month = d.getMonth() + 1
		const dateFormatted = month + "/" + d.getDate() + "/" + d.getFullYear();
		await mongoUsers.insertOne({id: interaction.user.id, firstName: firstName, lastName: lastName, club: club, state: state, dateJoined: dateFormatted, elo: 1000, wins: 0, losses: 0, eloBoosts: 0, topElo: 1000})
		const results1 = await mongoUsers.find({}).toArray();
		var eloArray = [];
		var idArray = [];
		console.log(results1)
		for(i = 0; i<results1.length; i++){
			eloArray.push(results1[i].elo)
			idArray.push(results1[i].id)
		}

		function quickSort(arr1, arr2, left = 0, right = arr1.length - 1) {
			if (left >= right) {
				return;
			}
			let pivotIndex = Math.floor((left + right) / 2);
			let pivotValue = arr1[pivotIndex];
			let i = left;
			let j = right;
			while (i <= j) {
				while (arr1[i] > pivotValue) {
					i++;
				}
				while (arr1[j] < pivotValue) {
					j--;
				}
				if (i <= j) {
					[arr1[i], arr1[j]] = [arr1[j], arr1[i]];
					[arr2[i], arr2[j]] = [arr2[j], arr2[i]];
					i++;
					j--;
				}
			}
			quickSort(arr1, arr2, left, j);
			quickSort(arr1, arr2, i, right);
		}

		quickSort(eloArray, idArray)
		var prevRanking;
		var prevElo;

		for(i = 1; i <= eloArray.length; i++){
			if(i == 1){
				prevRanking = i;
			}else{
				if(prevElo == eloArray[i-1]){
					if(interaction.user.id == idArray[i-1]){
						var ranking = prevRanking;
					}
				}else{
					prevRanking = i;
					if(interaction.user.id == idArray[i-1]){
						var ranking = i;
					}
				}
			}
			prevElo = eloArray[i-1]	
		}
		var ranking = "#" + ranking
		const embed = new EmbedBuilder()
		
	.setColor(0x0099FF)
	.setTitle(name + "'s Ranked PDT Profile")
	.addFields(
		{ name: 'Elo', value: '1000', inline: true},
		{ name: 'Highest Elo', value: "1000", inline: true },
		{ name: 'Ranking', value: ranking, inline: true },
		{ name: 'Record', value: "0-0", inline: true },
		{ name: 'Elo Boosts (1.2x)', value: "0", inline: true },
		{ name: 'Club', value: club, inline: true },
		{ name: 'State', value: state, inline: true },
		{ name: 'Date joined', value: dateFormatted, inline: true },
	)
	
		var role= interaction.member.guild.roles.cache.find(role => role.name === "Debater");
		interaction.member.roles.add(role);
		await interaction.channel.send({ embeds: [embed] });
		return interaction.reply({ content: "Your profile has been successfully created!", ephemeral: false });
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
