$(document).ready(function() {
    let selectedPlayerHeroes = [];
    let selectedCard = null;
    let isActionInProgress = false; 
    let isPlayerTurn = true;

    function addLog(msg) {
        const $log = $('<div class="log-entry"></div>').text(msg);
        $('#log-content').prepend($log);
    }

    // Fungsi baru untuk memperbarui tampilan visual ATK dan status pada kartu
    function updateCardVisuals(card) {
        const atkVal = getActualAtk(card);
        const $atkBadge = card.find('.stat-badge').eq(1); // Mengambil badge ATK (index 1)
        
        $atkBadge.html('<i class="fas fa-sword"></i> ' + atkVal);
        
        // Memberi warna indikator jika sedang terkena buff/debuff
        if (card.hasClass('buffed')) {
            $atkBadge.css('color', '#22c55e');
        } else if (card.hasClass('debuffed')) {
            $atkBadge.css('color', '#ef4444');
        } else {
            $atkBadge.css('color', '#000');
        }

        // Visual Shield/Iron Hide
        if (card.hasClass('shielded')) {
            card.css('box-shadow', '0 0 15px #fbbf24');
        } else {
            card.css('box-shadow', 'none');
        }
    }

    function buildDraft() {
        allHeroes.forEach(hero => {
            const $cardHtml = $(`
                <div class="card draft-card" data-hero-id="${hero.id}">
                    <div class="card-face">
                        <div class="card-header">${hero.name}</div>
                        <div class="card-body"></div>
                        <div class="card-footer">
                            <div class="stat-badge"><i class="fas fa-heart"></i> ${hero.hp}</div>
                            <div class="stat-badge"><i class="fas fa-sword"></i> ${hero.atk}</div>
                        </div>
                    </div>
                    <div class="card-back card-face">
                        <div class="role-label">${hero.role}</div>
                        <b>${hero.skill}</b><p>${hero.desc}</p>
                    </div>
                </div>`);
            
            $cardHtml.find('.card-face:not(.card-back)').css('background-color', hero.color);
            $('#draft-pool').append($cardHtml);
        });

        $('.draft-card').each(function() {
            const mc = new Hammer(this);
            mc.on("swipeleft swiperight", () => $(this).toggleClass('is-flipped'));
            $(this).on('click', function() {
                if ($(this).hasClass('is-flipped')) return;
                const id = $(this).data('hero-id');
                if ($(this).hasClass('selected-draft')) {
                    $(this).removeClass('selected-draft');
                    selectedPlayerHeroes = selectedPlayerHeroes.filter(h => h.id !== id);
                } else if (selectedPlayerHeroes.length < 5) {
                    $(this).addClass('selected-draft');
                    selectedPlayerHeroes.push(allHeroes.find(h => h.id === id));
                }
                $('#start-btn').prop('disabled', selectedPlayerHeroes.length !== 5);
            });
        });
    }

    function createCardElement(hero) {
        const $card = $(`
        <div class="card" data-name="${hero.name}" data-hp="${hero.hp}" data-max-hp="${hero.hp}" data-atk="${hero.atk}" data-energy="0" data-skill="${hero.id}">
            <div class="card-face">
                <div class="card-header">${hero.name} <div class="energy-bar-container"><div class="energy-fill"></div></div></div>
                <div class="skill-notif">SKILL!</div>
                <div class="card-body"></div>
                <div class="card-footer">
                    <div class="stat-badge hp-val"><i class="fas fa-heart"></i> ${hero.hp}</div>
                    <div class="stat-badge"><i class="fas fa-sword"></i> ${hero.atk}</div>
                </div>
            </div>
            <div class="card-back card-face">
                <div class="role-label">${hero.role}</div>
                <b>${hero.skill}</b><p>${hero.desc}</p>
            </div>
        </div>`);
        
        $card.find('.card-face:not(.card-back)').css('background-color', hero.color);
        return $card;
    }

    function startGame() {
        $('#setup-screen').hide();
        $('.container').css('display', 'flex');
        selectedPlayerHeroes.forEach(h => $('#player-side').append(createCardElement(h)));
        const opponentPool = [...allHeroes].sort(() => 0.5 - Math.random()).slice(0, 5);
        opponentPool.forEach(h => $('#opponent-side').append(createCardElement(h)));
        initGameLogic();
        addLog("Battle Started!");
    }

    function checkGameEnd() {
        if ($('#opponent-side .card').not('.dead').length === 0) {
            $('#result-text').text("YOU WIN!").css('color', '#22c55e');
            $('#result-screen').fadeIn(); return true;
        }
        if ($('#player-side .card').not('.dead').length === 0) {
            $('#result-text').text("YOU LOSE!").css('color', '#ef4444');
            $('#result-screen').fadeIn(); return true;
        }
        return false;
    }

    function initGameLogic() {
        isActionInProgress = true;
        setTimeout(() => {
            $('.card').addClass('is-flipped');
            setTimeout(() => { $('.card').removeClass('is-flipped'); isActionInProgress = false; }, 1200);
        }, 300);

        $('.card').each(function() {
            const mc = new Hammer(this);
            mc.on("swipeleft swiperight", () => {
                if (isActionInProgress) return;
                $(this).toggleClass('is-flipped');
                clearSelection();
            });
        });
    }

    function clearSelection() { $('.card').removeClass('selected').removeClass('can-be-attacked'); selectedCard = null; }
    
    function getActualAtk(card, target = null) {
        let base = parseInt(card.attr('data-atk'));
        if (card.hasClass('buffed')) base = Math.floor(base * 1.5);
        if (card.hasClass('debuffed')) base = Math.floor(base * 0.5);

        if (target) {
            const attackerHero = allHeroes.find(h => h.id == card.attr('data-skill'));
            const targetHero = allHeroes.find(h => h.id == target.attr('data-skill'));
            
            if (attackerHero && targetHero) {
                const aRole = attackerHero.role.toLowerCase();
                const tRole = targetHero.role.toLowerCase();

                if ((aRole === "warrior" && tRole === "mage") ||
                    (aRole === "mage" && tRole === "ranger") ||
                    (aRole === "ranger" && tRole === "warrior")) {
                    base = Math.floor(base * 1.15);
                }
            }
        }
        return base;
    }

    function updateHP(target, amount, healer = null, attacker = null) {
        const side = target.closest('#player-side').length ? "(player)" : "(opponent)";
        const name = target.attr('data-name');

        if (target.hasClass('shielded') && !healer && amount > 0) { 
            target.find('.skill-notif').text("BLOCKED!").fadeIn(200).delay(800).fadeOut(200); 
            addLog(`${name}${side} blocked the attack with shield!`);
            return; 
        }

        let finalAmount = amount;
        if (attacker && !healer) {
            const attackerHero = allHeroes.find(h => h.id == attacker.attr('data-skill'));
            const targetHero = allHeroes.find(h => h.id == target.attr('data-skill'));

            if (attackerHero && targetHero) {
                const aRole = attackerHero.role.toLowerCase();
                const tRole = targetHero.role.toLowerCase();

                if (tRole === "support" && aRole !== "support") {
                    finalAmount = Math.floor(finalAmount * 0.85);
                }

                if ((tRole === "warrior" && aRole === "ranger") ||
                    (tRole === "mage" && aRole === "warrior") ||
                    (tRole === "ranger" && aRole === "mage")) {
                    finalAmount = Math.floor(finalAmount * 1.15);
                }
            }
        }
        
        let newHp = healer ? Math.min(parseInt(target.attr('data-max-hp')), parseInt(target.attr('data-hp')) + finalAmount) : Math.max(0, parseInt(target.attr('data-hp')) - finalAmount);
        target.attr('data-hp', newHp).find('.hp-val').html('<i class="fas fa-heart"></i> ' + newHp);
        
        if (healer) {
            addLog(`${name}${side} was healed for ${finalAmount} HP`);
        } else if (finalAmount > 0) {
            target.addClass('shake'); 
            setTimeout(() => target.removeClass('shake'), 400);
            addLog(`${name}${side} took ${finalAmount} damage`);
        }
        
        if (newHp <= 0) {
            target.addClass('dead');
            addLog(`${name}${side} has fallen!`);
        }
    }

    function animateAttack(attacker, target, callback) {
        if (checkGameEnd()) return;
        isActionInProgress = true;
        const rot = attacker.hasClass('is-flipped') ? 'rotateY(180deg) ' : '';
        const dist = attacker.closest('#player-side').length > 0 ? -25 : 25;
        attacker.removeClass('selected').addClass('is-flying').css('transform', `${rot}translateY(${dist}px) scale(1)`);
        $('.card').removeClass('can-be-attacked');

        setTimeout(() => {
            const done = () => { 
                attacker.css('transform', `${rot}translateY(0)`); 
                setTimeout(() => { 
                    attacker.removeClass('is-flying'); 
                    isActionInProgress = false; 
                    // Update visual attacker setelah menyerang (mungkin energinya berubah)
                    updateCardVisuals(attacker);
                    if(!checkGameEnd()) callback(); 
                }, 350); 
            };
            
            if (parseInt(attacker.attr('data-energy')) >= 100) {
                attacker.removeClass('energy-full-aura').attr('data-energy', 0).find('.energy-fill').css('width', '0%');
                executeHeroSkill(attacker.attr('data-skill'), attacker, target, getActualAtk(attacker, target), updateHP, addLog, () => {
                    // Update semua kartu setelah skill (karena ada buff area)
                    $('.card').each(function() { updateCardVisuals($(this)); });
                    done();
                });
            }
            else { 
                updateHP(target, getActualAtk(attacker, target), false, attacker); 
                let en = Math.min(100, parseInt(attacker.attr('data-energy')) + 25); 
                attacker.attr('data-energy', en).find('.energy-fill').css('width', en+'%'); 
                if(en>=100) attacker.addClass('energy-full-aura'); 
                done(); 
            }
        }, 300);
    }

    function opponentTurn() {
        if (checkGameEnd()) return;
        isPlayerTurn = false; $('#turn-indicator').text("Opponent's Turn").addClass('turn-active');
        
        $('.card').each(function() { 
            const $card = $(this);
            const name = $card.attr('data-name');
            const side = $card.closest('#player-side').length ? "(player)" : "(opponent)";
            const skillId = $card.attr('data-skill');
            const heroData = allHeroes.find(h => h.id == skillId);
            
            ['buff','debuff','shield'].forEach(s => { 
                let t = parseInt($card.attr('data-'+s+'-timer')) || 0; 
                if(t>0){ 
                    t--; 
                    $card.attr('data-'+s+'-timer', t); 
                    if(t===0) {
                        $card.removeClass(s==='shield'?'shielded':s+'ed');
                        addLog(`${heroData.skill} effect on ${name}${side} has expired`);
                    } else {
                        addLog(`${name}${side} affected by ${heroData.skill} (${t} rounds left)`);
                    }
                }
            }); 
            // Perbarui visual setiap kartu di awal turn
            updateCardVisuals($card);
        });

        setTimeout(() => {
            let activeOpp = $('#opponent-side .card').not('.dead'), activePl = $('#player-side .card').not('.dead');
            if (activeOpp.length && activePl.length) {
                animateAttack($(activeOpp[Math.floor(Math.random()*activeOpp.length)]), $(activePl[Math.floor(Math.random()*activePl.length)]), () => { 
                    isPlayerTurn = true; 
                    $('#turn-indicator').text("Your Turn").removeClass('turn-active'); 
                });
            }
        }, 1000);
    }

    $(document).on('click', '.container .card', function(e) {
        if (isActionInProgress || !isPlayerTurn || $(this).hasClass('dead')) return;
        if ($(this).closest('#player-side').length > 0) {
            if ($(this).hasClass('is-flipped')) { clearSelection(); return; }
            if (selectedCard && selectedCard.is($(this))) clearSelection();
            else { clearSelection(); selectedCard = $(this); $(this).addClass('selected'); $('#opponent-side .card').not('.dead').addClass('can-be-attacked'); }
        } else if (selectedCard && !selectedCard.hasClass('is-flipped')) {
            animateAttack(selectedCard, $(this), () => setTimeout(opponentTurn, 600));
        }
    });

    buildDraft();
    $('#start-btn').on('click', startGame);
    
    $('#restart-btn').on('pointerdown touchstart', function(e) { 
        e.preventDefault();
        location.reload(); 
    });

    $(document).on('click', (e) => { if(!$(e.target).closest('.card').length && !$(e.target).closest('#log-popup').length) clearSelection(); });
});
