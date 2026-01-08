const allHeroes = [
    { id: 1, name: "VIDAR", hp: 30, atk: 8, skill: "Dual Strike", desc: "Deals double damage to the target enemy.", color: "#2563eb", role: "Warrior" },
    { id: 2, name: "FREYA", hp: 25, atk: 7, skill: "Goddess Care", desc: "10% damage, then heals 90% ATK to the ally with lowest HP.", color: "#db2777", role: "Support" },
    { id: 3, name: "SIF", hp: 15, atk: 15, skill: "Soul Eater", desc: "110% damage, converts the damage dealt into self HP.", color: "#d97706", role: "Ranger" },
    { id: 4, name: "BALDUR", hp: 30, atk: 8, skill: "Light Chain", desc: "25% damage, then strikes 5 random enemies for 25% ATK.", color: "#059669", role: "Warrior" },
    { id: 5, name: "TYR", hp: 20, atk: 12, skill: "God of War", desc: "25% damage, chance for additional strikes up to 10 times.", color: "#7c3aed", role: "Mage" },
    { id: 6, name: "ODIN", hp: 25, atk: 7, skill: "Odin's Blessing", desc: "Restores 100% energy to the ally with the least energy.", color: "#dc2626", role: "Support" },
    { id: 7, name: "LOKI", hp: 20, atk: 12, skill: "Deception", desc: "Deals 200% massive damage to the enemy.", color: "#0891b2", role: "Mage" },
    { id: 8, name: "THOR", hp: 30, atk: 8, skill: "Thunder Weakness", desc: "Reduces ATK of all enemies by 50% for 3 rounds.", color: "#ea580c", role: "Warrior" },
    { id: 10, name: "FENRIR", hp: 15, atk: 15, skill: "Iron Hide", desc: "Makes self immune to any damage for 3 rounds.", color: "#475569", role: "Ranger" },
    { id: 9, name: "HELLA", hp: 25, atk: 7, skill: "Deathly Buff", desc: "Increases ATK of all allies by 50% for 3 rounds.", color: "#4f46e5", role: "Support" }
];

function executeHeroSkill(skillId, attacker, target, baseAtk, updateHP, addLog, onComplete) {
    const aSide = attacker.closest('#player-side').length ? "(player)" : "(opponent)";
    const aName = attacker.attr('data-name');
    const heroData = allHeroes.find(h => h.id == skillId);
    
    const finalAtk = baseAtk; 
    const msg = (t) => attacker.find('.skill-notif').text(t).fadeIn(200).delay(800).fadeOut(200);
    
    addLog(`${aName}${aSide} used skill: ${heroData.skill}`);

    switch(parseInt(skillId)) {
        case 1: msg("DOUBLE!"); updateHP(target, finalAtk * 2, false, attacker); onComplete(); break;
        case 2: updateHP(target, Math.floor(finalAtk * 0.1), false, attacker); let friends = attacker.closest('.card-row').find('.card').not('.dead'); let low = friends.first(); friends.each(function(){ if(parseInt($(this).attr('data-hp')) < parseInt(low.attr('data-hp'))) low=$(this); }); updateHP(low, Math.floor(finalAtk * 0.9), true); msg("HEAL!"); onComplete(); break;
        case 3: let d = Math.floor(finalAtk * 1.1); updateHP(target, d, false, attacker); updateHP(attacker, d, true); msg("LIFE!"); onComplete(); break;
        case 4: updateHP(target, Math.floor(finalAtk * 0.25), false, attacker); let en = target.closest('.card-row').find('.card').not('.dead'); let c=0; let mC=Math.min(5, en.length); for(let i=0; i<mC; i++){ let r = $(en[Math.floor(Math.random()*en.length)]); setTimeout(() => { updateHP(r, Math.floor(finalAtk * 0.25), false, attacker); c++; if(c===mC) onComplete(); }, i*120); } msg("CHAIN!"); break;
        case 5: let h=0, ch=1.0; let it = setInterval(() => { updateHP(target, Math.floor(finalAtk*0.25), false, attacker); h++; ch-=0.1; if(h>=10 || Math.random()>ch || target.hasClass('dead')){ clearInterval(it); msg(h+"X!"); onComplete(); }}, 150); break;
        case 6: let fds = attacker.closest('.card-row').find('.card').not('.dead').not(attacker); if(fds.length){ let lE = fds.first(); fds.each(function(){ if(parseInt($(this).attr('data-energy')) < parseInt(lE.attr('data-energy'))) lE=$(this); }); lE.attr('data-energy', 100).addClass('energy-full-aura').find('.energy-fill').css('width', '100%'); addLog(`${lE.attr('data-name')} received energy transfer!`); } msg("GIFT!"); onComplete(); break;
        case 7: updateHP(target, finalAtk * 2, false, attacker); msg("CRIT!"); onComplete(); break;
        case 8: updateHP(target, Math.floor(finalAtk*0.05), false, attacker); target.closest('.card-row').find('.card').addClass('debuffed').attr('data-debuff-timer', 3); addLog(`${heroData.skill} (3 rounds remaining)`); msg("WEAK!"); onComplete(); break;
        case 9: attacker.closest('.card-row').find('.card').addClass('buffed').attr('data-buff-timer', 3); addLog(`${heroData.skill} (3 rounds remaining)`); msg("BUFF!"); onComplete(); break;
        case 10: attacker.addClass('shielded').attr('data-shield-timer', 3); addLog(`${heroData.skill} (3 rounds remaining)`); msg("IRON!"); onComplete(); break;
    }
}
