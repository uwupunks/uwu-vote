export const calcVotes = (votes) => {
    // Convert uwuBalance to numbers and calculate total uwu
const totalUwu = votes.reduce((sum, entry) => {
    return sum + BigInt(entry.uwuBalance ?? 0);
  }, BigInt(0));
  
  // Calculate percentages and prepare results
  const results = votes.map(entry => {
    const uwu = BigInt(entry.uwuBalance ?? 0);
    const uwuPercentage = (Number(uwu) / Number(totalUwu)) * 100;
    const voteNumber = entry.vote.split('=')[1]; // Extract vote number (e.g., "2" or "3")
    
    return {
      address: entry.address,
      uwuBalance: entry.uwuBalance,
      vote: voteNumber,
      votingPower: uwuPercentage.toFixed(4) + '%' // Voting power is same as uwu percentage in stake-weighted voting
    };
  });
  
  // Aggregate voting power by vote option
  const voteSummary = votes.reduce((acc, entry) => {
    const voteNumber = entry.vote.split('=')[1];
    const uwu = BigInt(entry.uwuBalance ?? 0);
    const votingPower = (Number(uwu) / Number(totalUwu)) * 100;
    
    acc[voteNumber] = (acc[voteNumber] || 0) + votingPower;
    return acc;
  }, {});
  
  // Output results
  console.log("Total uwu Balance:", totalUwu.toString());
  console.log("\nIndividual Results:");
  results.forEach(result => {
    console.log(`Address: ${result.address}`);
    console.log(`  uwu Balance: ${result.uwuBalance}`);
    console.log(`  Vote: ${result.vote}`);
    console.log(`  Voting Power: ${result.votingPower}`);
    console.log("------------------------");
  });
  
  console.log("\nVote Summary (Stake-Weighted):");
  for (const [vote, percentage] of Object.entries(voteSummary)) {
    console.log(`Vote ${vote}: ${percentage?.toFixed(4)}%`);
  }
  return {
    totalUwu: totalUwu.toString(),
    results,
    voteSummary
  };
}