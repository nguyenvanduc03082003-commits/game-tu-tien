import { CombatStatsComponent } from '../modules/combat/CombatComponents.ts';
import { evaluateMaintainedAssistance } from '../modules/combat/CombatIntentService.ts';
import { readSocialTelemetry } from '../modules/social/SocialSimulationTelemetry.ts';
import { readSocialFamiliarity, evaluateSocialFamiliarity } from '../modules/social/SocialFamiliarityService.ts';
import { socialEventTime } from '../modules/social/SocialEventTime.ts';
import { SOCIAL_CONFIG } from '../config/social.config.ts';
import { ECSWorld } from '../ecs/World.ts';
import { CorpseComponent, GraveComponent, HealthComponent, NameComponent, PositionComponent } from '../modules/beings/BeingComponents.ts';
import { RelationshipRecord, SocialRelationshipComponent, isProtectedRelationship } from '../modules/social/SocialComponents.ts';
import { BondEligibility, RelationshipRejectionReason, evaluateCompanionBond, evaluateMentorship,
  evaluateSwornBond, isActiveBondBetween } from '../modules/social/RelationshipRules.ts';
import { getSocialCooldownRemainingDays } from '../modules/social/SocialInteractionService.ts';
import { SocialCooldownChannel } from '../modules/social/SocialCooldown.ts';
import { readConversationSnapshot, evaluateConversation, ConversationRejectionReason, ConversationOutcome } from '../modules/social/SocialConversationService.ts';
import { evaluateSocialAssistance, SocialAssistanceRejectionReason } from '../modules/social/SocialDecisionService.ts';

const CONVERSATION_REASONS: Record<ConversationRejectionReason, string> = {
  participant_unavailable: 'Một người không còn sống hoặc thiếu dữ liệu cần thiết',
  out_of_range: `Chưa ở trong phạm vi ${SOCIAL_CONFIG.conversation.maxDistance} để trò chuyện`,
  unsafe: 'Một người đang chiến đấu hoặc nguy cấp', cooldown_active: 'Cặp đang trong thời gian chờ giao tiếp',
  declined: 'Một phía có hảo cảm quá thấp để tiếp chuyện', invalid_context: 'Chưa đủ điều kiện cho nội dung cuộc gặp',
};
const OUTCOMES: Record<ConversationOutcome, string> = { warm: 'Thuận lợi', neutral: 'Trung tính', awkward: 'Vụng về' };
const ASSISTANCE_REASONS: Record<SocialAssistanceRejectionReason, string> = {
  participant_unavailable: 'Người tham gia không khả dụng hoặc thiếu dữ liệu chiến đấu/vị trí',
  no_active_bond: 'Không có đạo lữ, sư đồ hoặc kết nghĩa đang hoạt động hợp lệ',
  insufficient_affinity: `Hảo cảm của người giúp chưa đạt ${SOCIAL_CONFIG.assistance.minAffinity}`,
  insufficient_trust: `Tin tưởng của người giúp chưa đạt ${SOCIAL_CONFIG.assistance.minTrust}`,
  self_preservation: `Người giúp còn HP ≤ ${SOCIAL_CONFIG.assistance.fleeHealthRatio * 100}%, ưu tiên tự bảo toàn`,
  already_engaged: 'Người giúp đã có mục tiêu chiến đấu, giữ mục tiêu hiện tại',
  no_live_enemy: 'Người được giúp chưa có mục tiêu chiến đấu hợp lệ để can thiệp',
  out_of_range: `Ngoài phạm vi trợ chiến ${SOCIAL_CONFIG.assistance.radius}`,
  conflicting_bond: 'Kẻ địch có ràng buộc đang hoạt động với người giúp',
};

const REASONS: Record<RelationshipRejectionReason, string> = {
  self_relationship: 'Không thể lập quan hệ với chính mình',
  participant_unavailable: 'Một người không còn sống hoặc thiếu thông tin xã hội',
  existing_bond_conflict: 'Xung đột với ràng buộc hiện có hoặc ràng buộc thiếu phía đối ứng',
  close_kin: 'Có quan hệ huyết thống gần',
  underage: `Cần cả hai từ ${SOCIAL_CONFIG.companion.minAge} tuổi`,
  insufficient_mutual_affinity: 'Hảo cảm chưa đạt ngưỡng ở cả hai phía',
  insufficient_trust: 'Tín nhiệm chưa đạt ngưỡng',
  insufficient_respect: 'Người học chưa đủ kính trọng người dạy',
  insufficient_interactions: 'Chưa đủ số lần tương tác ở cả hai phía',
  already_has_companion: 'Một người đã có đạo lữ đang hoạt động',
  realm_requirements_not_met: 'Cảnh giới chưa phù hợp để hình thành sư đồ',
  already_has_master: 'Người học đã có sư phụ đang hoạt động',
  master_capacity_reached: `Người dạy đã đủ ${SOCIAL_CONFIG.mentorship.maxActiveDisciples} đồ đệ đang hoạt động`,
  parentage_not_confirmed: 'Chưa có dữ liệu xác nhận cha mẹ/con',
  cooldown_active: 'Đang trong thời gian chờ',
};

function formatDays(value: number): string {
  return (Math.ceil(value * 100) / 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}

function renderFamiliarity(world: ECSWorld, owner: number, target: number, ownName: string,
  targetName: string, escape: (value: unknown) => string): string {
  const config = SOCIAL_CONFIG.familiarity;
  const line = (a: number, b: number, label: string) => {
    const record = world.getComponent(a, SocialRelationshipComponent)?.getRelationship(b);
    const reverse = world.getComponent(b, SocialRelationshipComponent)?.getRelationship(a);
    const hpA = world.getComponent(a, HealthComponent), hpB = world.getComponent(b, HealthComponent);
    let text: string;
    if (!hpA || !hpB || hpA.isDead || hpB.isDead || hpA.current <= 0 || hpB.current <= 0)
      text = 'Không tích lũy với người đã mất hoặc không còn đủ dữ liệu.';
    else if (!record || !reverse) text = 'Chưa có đủ ghi nhận quan hệ ở cả hai phía.';
    else if (record.trust >= config.maxTrust) text = `Tín nhiệm hiện đã từ ${config.maxTrust}; không nhận thêm từ cơ chế tiếp xúc thường ngày. Nguồn khác vẫn có thể tăng thêm.`;
    else if (record.affinity < config.minMutualAffinity || reverse.affinity < config.minMutualAffinity)
      text = `Cần hảo cảm cả hai phía từ ${config.minMutualAffinity} để bắt đầu tích lũy.`;
    else {
      const progress = readSocialFamiliarity(world, a, b);
      const expired = record.familiarity && world.calendarDaysAtTick() - record.familiarity.lastQualifiedDay >= config.expiryDays;
      const count = progress?.neutralCount ?? 0;
      text = `${count}/${config.neutralMeetings} cuộc gặp trung tính đủ điều kiện; còn ${config.neutralMeetings - count} cuộc để nhận tối đa +${config.trustPerReward} tín nhiệm.`;
      if (expired) text += ' Tiến độ cũ đã hết hiệu lực vì lâu không gặp.';
      if (progress) text += ` Gặp đủ điều kiện gần nhất: ngày ${formatDays(progress.lastQualifiedDay)}; còn ${formatDays(Math.max(0, config.expiryDays - (world.calendarDaysAtTick() - progress.lastQualifiedDay)))} ngày trước khi tiến độ hết hiệu lực.`;
    }
    return `<div style="margin-top:4px;"><b>${escape(label)}</b>: ${escape(text)}</div>`;
  };
  return `<div style="margin-top:7px;border-top:1px solid #30363d;padding-top:5px;line-height:1.5;overflow-wrap:anywhere;">
    <b>Quen nhau qua những cuộc gặp</b>
    ${line(owner, target, `${ownName} → ${targetName}`)}${line(target, owner, `${targetName} → ${ownName}`)}
    <div style="color:#8b949e;font-size:10px;margin-top:4px;">Chỉ tính cuộc gặp đã hoàn tất. Cuộc gặp ấm áp tăng tín nhiệm theo kết quả riêng; ấm áp hoặc vụng về xóa tiến độ trung tính của phía tương ứng. Nghỉ từ ${config.expiryDays} ngày làm tiến độ cũ hết hiệu lực. Đủ tiến độ chưa bảo đảm hình thành ràng buộc.</div>
  </div>`;
}

const END_REASONS = { death: 'Qua đời', betrayal: 'Phản bội', estrangement: 'Xa cách / mâu thuẫn' } as const;

function lifecycleHtml(record: RelationshipRecord, escape: (value: unknown) => string): string {
  const bond = record.bond;
  const formed = bond?.formedAtDay !== undefined ? `Ngày ${formatDays(bond.formedAtDay)}`
    : record.specialBondDate ? `${record.specialBondDate} (ghi chép cũ)` : 'Chưa có ngày hình thành được ghi nhận';
  return `<div style="margin-top:5px;overflow-wrap:anywhere;line-height:1.5;">
    <div>Hình thành: ${escape(formed)}</div>
    ${bond?.status === 'ended' ? `<div>Kết thúc: ${bond.endedAtDay !== undefined ? `Ngày ${formatDays(bond.endedAtDay)}` : 'Chưa có ngày được ghi nhận'}</div>
      <div>Nguyên nhân: ${escape(bond.endReason ? END_REASONS[bond.endReason] : 'Chưa được ghi nhận')}</div>` : ''}
    ${!bond ? '<div style="color:#8b949e;">Chưa có mốc vòng đời; trạng thái được đối chiếu với người tham gia.</div>' : ''}
  </div>`;
}

/** Archived episodes are snapshots; never compare them with current roles to mark them active. */
export function renderSocialBondHistory(social: SocialRelationshipComponent | null | undefined, entity: number,
  open: boolean, escape: (value: unknown) => string): string {
  const history = [...(social?.bondHistory ?? [])].sort((a, b) =>
    (b.bond?.endedAtDay ?? -1) - (a.bond?.endedAtDay ?? -1));
  return `<details data-social-details="${entity}:history" data-social-loaded="${open}" ${open ? 'open' : ''}
    style="border-top:1px solid #30363d;padding-top:6px;font-size:11px;">
    <summary style="cursor:pointer;color:#79c0ff;">LỊCH SỬ RÀNG BUỘC (${history.length})</summary>
    <div style="color:#8b949e;font-size:10px;margin:5px 0;">Các lần kết thúc đã được lưu khi hình thành ràng buộc mới. Ràng buộc vừa kết thúc nằm trong mạng lưới phía trên. Giữ tối đa ${SOCIAL_CONFIG.lifecycle.maxHistory} mục gần nhất.</div>
    ${!open ? '' : history.length ? history.map(record => `<div style="background:#161b22;border:1px solid #30363d;border-radius:5px;padding:7px;margin-top:5px;overflow-wrap:anywhere;">
      <b>${escape(SocialRelationshipComponent.getRelationBadge(record.relationType))} · ${escape(record.targetName)}</b>
      <div style="color:#9ca3af;">Ràng buộc đã kết thúc · bản ghi lịch sử</div>
      ${lifecycleHtml(record, escape)}
      <div style="font-size:10px;margin-top:4px;">Điểm khi lưu: hảo cảm ${record.affinity} · tín nhiệm ${record.trust} · kính trọng ${record.respect}</div>
    </div>`).join('') : '<div style="color:#8b949e;margin-top:5px;">Chưa có lần hình thành trước được lưu vào lịch sử.</div>'}
  </details>`;
}

/** Chỉ đọc và dựng HTML; không gọi factory, RNG, API ghi hoặc dọn ledger. */
export function renderSocialRelationshipDetails(world: ECSWorld, entity: number, record: RelationshipRecord,
  targetExists: boolean, open: boolean, escape: (value: unknown) => string): { statusHtml: string; focusHtml: string; detailsHtml: string } {
  const target = record.targetEntityId;
  const ownName = world.getComponent(entity, NameComponent)?.name ?? 'Nhân vật đang xem';
  const targetName = world.getComponent(target, NameComponent)?.name ?? record.targetName;
  const hp = world.getComponent(target, HealthComponent);
  const deceased = !!hp && (hp.isDead || hp.current <= 0) || world.hasComponent(target, CorpseComponent) || world.hasComponent(target, GraveComponent);
  const reciprocalType = isProtectedRelationship(record.relationType) || record.relationType === 'sworn_brother';
  const active = reciprocalType && isActiveBondBetween(world, entity, target, record.relationType);
  const status = !targetExists ? 'Quan hệ lịch sử · không còn trong thế giới'
    : deceased ? 'Quan hệ lịch sử · đã mất'
    : record.bond?.status === 'ended' ? 'Ràng buộc đã kết thúc · quan hệ lịch sử'
    : reciprocalType ? active ? 'Ràng buộc đang hoạt động' : 'Ràng buộc chưa đủ phía đối ứng hoặc người tham gia không khả dụng'
    : !hp ? 'Chưa có thông tin sinh tồn của đối tượng' : 'Quan hệ với người đang sống';
  const statusHtml = `<div style="font-size:10px;color:${active ? '#4ade80' : '#9ca3af'};">${escape(status)}</div>`;
  const canFocus = targetExists && world.hasComponent(target, PositionComponent);
  const focusHtml = canFocus
    ? `<button class="focus-rel-entity-btn" data-ent="${target}" title="Xem vị trí hiện tại" style="background:#21262d;border:1px solid #30363d;color:#58a6ff;font-size:10px;padding:2px 6px;border-radius:4px;cursor:pointer;">${deceased ? '🎯 Xem di tích' : '🎯 Xem'}</button>`
    : '<span style="font-size:10px;color:#8b949e;">Không có vị trí</span>';

  const reverse = world.getComponent(target, SocialRelationshipComponent)?.getRelationship(entity);
  const scoreRow = (name: string, scores: RelationshipRecord | null | undefined) => `<tr>
    <td style="padding:3px 4px;overflow-wrap:anywhere;">${escape(name)}</td>
    <td style="padding:3px 4px;">${scores ? scores.affinity : '—'}</td>
    <td style="padding:3px 4px;">${scores ? scores.trust : '—'}</td>
    <td style="padding:3px 4px;">${scores ? scores.respect : '—'}</td>
    <td style="padding:3px 4px;">${scores ? scores.interactionsCount : '—'}</td></tr>`;

  const cooldowns: [SocialCooldownChannel, string][] = [
    ['communication', 'Giao tiếp'], ['healing', 'Chữa thương'], ['teaching', 'Chỉ điểm'],
    ['bondAttempt', 'Đề nghị ràng buộc'], ['attackedScores', 'Bị đánh'], ['witnessedScores', 'Chứng kiến'], ['combatMemory', 'Ký ức chiến đấu'], ['rescueLife', 'Cứu mạng'],
  ];
  const cooldownHtml = cooldowns.map(([channel, label]) => {
    const remaining = getSocialCooldownRemainingDays(world, entity, target, channel);
    return remaining > 0 ? `<div>${escape(label)}: còn <b>${formatDays(remaining)} ngày</b></div>` : '';
  }).join('');
  const bondWait = getSocialCooldownRemainingDays(world, entity, target, 'bondAttempt');
  const eligibilityLine = (label: string, eligibility: BondEligibility, requirements: string) => {
    const text = eligibility.status === 'already_exists' ? 'Đã hình thành'
      : eligibility.status === 'eligible' ? bondWait > 0 ? `Đủ điều kiện · chờ ${formatDays(bondWait)} ngày` : 'Đủ điều kiện để thử'
      : eligibility.reasons.map(reason => REASONS[reason]).join('; ');
    return `<div style="margin-top:6px;"><b>${escape(label)}</b>: ${escape(text)}
      <div style="color:#8b949e;font-size:10px;">${escape(requirements)}</div></div>`;
  };
  const companion = SOCIAL_CONFIG.companion;
  const sworn = SOCIAL_CONFIG.sworn;
  const mentor = SOCIAL_CONFIG.mentorship;
  const mentorRequirements = `Thầy: hảo cảm ≥ ${mentor.teacherAffinity}, tín nhiệm ≥ ${mentor.teacherTrust}; trò: hảo cảm ≥ ${mentor.learnerAffinity}, tín nhiệm ≥ ${mentor.learnerTrust}, kính trọng ≥ ${mentor.learnerRespect}. Thầy là tu sĩ, trò là phàm nhân khi bái sư. Tối đa ${mentor.maxActiveMasters} thầy/${mentor.maxActiveDisciples} trò.`;
  const eligibilityHtml = !open ? '' : !targetExists || deceased ? '<div style="color:#8b949e;margin-top:6px;">Không đề nghị ràng buộc mới với đối tượng lịch sử.</div>' : [
    eligibilityLine('Đạo lữ', evaluateCompanionBond(world, entity, target), `Hai phía: tuổi ≥ ${companion.minAge}, hảo cảm ≥ ${companion.minAffinity}, tín nhiệm ≥ ${companion.minTrust}, tương tác ≥ ${companion.minInteractions}; không họ gần, không có đạo lữ khác.`),
    eligibilityLine('Kết nghĩa', evaluateSwornBond(world, entity, target), `Hai phía: hảo cảm ≥ ${sworn.minAffinity}, tín nhiệm ≥ ${sworn.minTrust}, tương tác ≥ ${sworn.minInteractions}; không họ gần hoặc xung đột ràng buộc.`),
    eligibilityLine(`${ownName} nhận ${targetName} làm trò`, evaluateMentorship(world, entity, target), mentorRequirements),
    eligibilityLine(`${ownName} bái ${targetName} làm thầy`, evaluateMentorship(world, target, entity), mentorRequirements),
  ].join('');

  const conflictHtml = !open || !active ? '' : [
    [ownName, record], [targetName, reverse],
  ].map(([name, value]) => {
    const side = value as RelationshipRecord | null | undefined;
    const since = side?.bond?.conflictSinceDay;
    if (since === undefined) return '';
    const remaining = Math.max(0, SOCIAL_CONFIG.lifecycle.conflictDays - (world.calendarDaysAtTick() - since));
    return `<div style="color:#fbbf24;margin-top:4px;">${escape(name)}: mâu thuẫn từ ngày ${formatDays(since)}; còn ${formatDays(remaining)} ngày nếu hảo cảm ≤ ${SOCIAL_CONFIG.lifecycle.conflictAffinity} và tín nhiệm ≤ ${SOCIAL_CONFIG.lifecycle.conflictTrust}. Hồi phục qua một ngưỡng sẽ tính lại từ đầu.</div>`;
  }).join('');
  const rescueReceived = getSocialCooldownRemainingDays(world, entity, target, 'rescueLife');
  const rescueGiven = getSocialCooldownRemainingDays(world, target, entity, 'rescueLife');
  const rescueHtml = !open ? '' : `<div style="font-size:10px;color:#8b949e;margin-top:6px;line-height:1.5;">
    <b>Cứu mạng</b>: cần người đang nguy hiểm (HP ≤ ${SOCIAL_CONFIG.rescue.dangerHealthRatio * 100}%), bằng chứng bị đe dọa và người giúp hạ kẻ địch trong phạm vi ${SOCIAL_CONFIG.rescue.radius}; không còn mối đe dọa khác được biết. Tặng đan chữa thương được ghi là giúp đỡ, không tự tính là cứu mạng.
    <div>${escape(ownName)} nhận cứu mạng từ ${escape(targetName)}: ${rescueReceived > 0 ? `chờ ${formatDays(rescueReceived)} ngày` : 'không có thời gian chờ'}.</div>
    <div>${escape(targetName)} nhận cứu mạng từ ${escape(ownName)}: ${rescueGiven > 0 ? `chờ ${formatDays(rescueGiven)} ngày` : 'không có thời gian chờ'}.</div>
    <div>Không có thời gian chờ chỉ là một điều kiện; chưa xác nhận có tình huống cứu mạng.</div>
  </div>`;
  let decisionsHtml = '';
  if (open) {
    const snapshot = readConversationSnapshot(world, entity, target);
    const conversation = evaluateConversation(snapshot);
    const sideLine = (name: string, side: typeof snapshot.a) =>
      `<div>${escape(name)}: mức hướng ngoại ${formatDays(side.sociability * 100)}% · ${side.busy ? 'đang bận' : 'chưa ghi nhận đang bận'}.</div>`;
    const prediction = conversation.status === 'skipped' ? escape(CONVERSATION_REASONS[conversation.reason]) :
      [conversation.evaluation.a, conversation.evaluation.b].map((side, index) => {
        const progress = evaluateSocialFamiliarity(index === 0 ? record.familiarity : reverse?.familiarity,
          side.outcome, index === 0 ? snapshot.a.affinity : snapshot.b.affinity,
          index === 0 ? snapshot.b.affinity : snapshot.a.affinity,
          index === 0 ? snapshot.a.trust : snapshot.b.trust, socialEventTime(world));
        return `<div>${escape(index === 0 ? ownName : targetName)} → ${escape(index === 0 ? targetName : ownName)}: ${OUTCOMES[side.outcome]}; dự kiến hảo cảm ${side.delta.affinity > 0 ? '+' : ''}${side.delta.affinity}, tín nhiệm +${side.delta.trust + progress.trustDelta}, kính trọng +${side.delta.respect}${progress.trustDelta > 0 ? ' (gồm tín nhiệm tích lũy từ những lần gặp trước)' : ''}.</div>`;
      }).join('');
    const assistanceLine = (helper: number, ally: number, helperName: string, allyName: string) => {
      const result = evaluateSocialAssistance(world, helper, ally);
      const enemyName = result.status === 'eligible' ? world.getComponent(result.enemyId, NameComponent)?.name ?? 'kẻ địch' : '';
      return `<div>${escape(helperName)} giúp ${escape(allyName)}: ${result.status === 'eligible'
        ? `Hiện đủ điều kiện can thiệp đối với [${escape(enemyName)}]` : escape(ASSISTANCE_REASONS[result.reason])}.</div>`;
    };
    decisionsHtml = `<div style="font-size:10px;line-height:1.5;overflow-wrap:anywhere;border-top:1px solid #30363d;margin-top:6px;padding-top:5px;">
      <b>Giao tiếp hiện tại · trò chuyện thường</b>
      ${sideLine(ownName, snapshot.a)}${sideLine(targetName, snapshot.b)}
      <div>${prediction}</div>
      <div style="color:#8b949e;">Đây là đánh giá hiện tại, chưa tăng điểm. AI xét tối đa ${SOCIAL_CONFIG.socialDecision.maxCandidates} người hợp lệ gần nhất trong bán kính ${SOCIAL_CONFIG.socialDecision.searchRadius}; người được chọn phải kiểm tra lại khi gặp. Thiếu dữ liệu tính cách dùng mức trung tính 50%.</div>
      <b>Trợ chiến tự nguyện · hai hướng</b>
      ${assistanceLine(entity, target, ownName, targetName)}${assistanceLine(target, entity, targetName, ownName)}
      <div style="color:#8b949e;">Cần hảo cảm ≥ ${SOCIAL_CONFIG.assistance.minAffinity}, tin tưởng ≥ ${SOCIAL_CONFIG.assistance.minTrust} ở người giúp, HP > ${SOCIAL_CONFIG.assistance.fleeHealthRatio * 100}% và ràng buộc hoạt động. Đủ điều kiện chưa bảo đảm AI sẽ chọn; từ chối không kết thúc quan hệ. Trợ chiến không tự tính là cứu mạng.</div>
    </div>`;
  }
  const detailsHtml = `<details data-social-details="${entity}:${target}" data-social-loaded="${open}" ${open ? 'open' : ''} style="font-size:11px;border-top:1px solid #30363d;padding-top:4px;">
    <summary style="cursor:pointer;color:#79c0ff;">Vòng đời · hai phía · điều kiện · thời gian chờ</summary>
    <table style="width:100%;font-size:10px;margin-top:5px;border-collapse:collapse;">
      <thead><tr><th>Phía đánh giá</th><th>Hảo cảm</th><th>Tín nhiệm</th><th>Kính trọng</th><th>Lần gặp</th></tr></thead>
      <tbody>${scoreRow(`${ownName} → ${targetName}`, record)}${scoreRow(`${targetName} → ${ownName}`, reverse)}</tbody>
    </table>
    ${!reverse ? '<div style="font-size:10px;color:#8b949e;">Phía đối diện chưa có bản ghi hoặc không còn dữ liệu.</div>' : ''}
    ${lifecycleHtml(record, escape)}
    ${conflictHtml}
    ${rescueHtml}
    ${decisionsHtml}
    ${open ? renderFamiliarity(world, entity, target, ownName, targetName, escape) : ''}
    ${open ? renderCombatIntent(world, entity, escape) : ''}
    <div style="margin-top:5px;color:#fbbf24;">${cooldownHtml || 'Không có thời gian chờ còn hiệu lực cho chiều đang xem.'}</div>
    ${eligibilityHtml}
    <div style="font-size:10px;color:#8b949e;margin-top:6px;">Đủ điều kiện vẫn cần lần thử thành công khi gặp nhau. Thời gian chờ tính theo ngày trong game; tạm dừng không làm thời gian trôi.</div>
  </details>`;
  return { statusHtml, focusHtml, detailsHtml };
}

function renderCombatIntent(world: ECSWorld, entity: number, escape: (value: unknown) => string): string {
  const stats = world.getComponent(entity, CombatStatsComponent);
  if (!stats?.targetEntityId) return '<div>Chưa có mục tiêu chiến đấu.</div>';
  const intent = stats.combatIntent;
  const labels = { autonomous: 'AI tự chọn', self_defense: 'Tự vệ sau khi bị đánh', social_assistance: 'Trợ chiến tự nguyện', god_decree: 'Thần dụ' };
  const target = world.getComponent(stats.targetEntityId, NameComponent)?.name ?? `#${stats.targetEntityId}`;
  const result = evaluateMaintainedAssistance(world, entity);
  const reasons: Record<string, string> = { ...ASSISTANCE_REASONS, stale_intent: 'Dữ liệu mục tiêu không còn khớp', bond_episode_changed: 'Ràng buộc đã đổi sang lần hình thành khác', ally_target_changed: 'Người được giúp đã đổi kẻ địch' };
  return `<div style="margin-top:6px;font-size:10px;">Mục tiêu hiện tại: ${escape(target)} · ${escape(intent ? labels[intent.source] : 'Chưa ghi nhận nguồn')}.
    ${intent?.source === 'social_assistance' ? `<div>Người được giúp: ${escape(world.getComponent(intent.allyId!, NameComponent)?.name ?? `#${intent.allyId}`)}. ${result.status === 'maintained' ? 'Hiện đủ điều kiện tiếp tục trợ chiến.' : `Dự kiến dừng: ${escape(reasons[result.reason ?? ''] ?? 'Dữ liệu không còn phù hợp')}.`}</div>` : ''}
    <div style="color:#8b949e;">Đánh giá chỉ đọc; việc duy trì hoặc dừng do vòng mô phỏng thực hiện.</div></div>`;
}

export function renderSocialSimulationDebug(world: ECSWorld, entity: number, open: boolean, escape: (value: unknown) => string): string {
  const data = readSocialTelemetry(world);
  const counts = Object.entries(data.counters).sort((a, b) => b[1] - a[1]).slice(0, 20);
  const total = (prefix: string) => Object.entries(data.counters).reduce((sum, [key, value]) => sum + (key.startsWith(prefix) ? value : 0), 0);
  const count = (key: string) => data.counters[key] ?? 0;
  return `<details data-social-details="${entity}:debug" data-social-loaded="${open}" ${open ? 'open' : ''} style="font-size:10px;border-top:1px solid #30363d;padding-top:6px;">
    <summary style="cursor:pointer;color:#8b949e;">Công cụ phát triển · theo dõi mô phỏng xã hội</summary>
    ${!open ? '' : `<button data-social-telemetry-toggle>${data.enabled ? 'Tắt' : 'Bật'} thu số liệu</button>
    <div>Toàn thế giới · mặc định tắt · tối đa 128 bộ đếm và 200 mẫu gần nhất. Không lưu vào bản lưu; tạo thế giới hoặc tải lại sẽ xóa. Bảng hiển thị 20 bộ đếm và 10 mẫu. Đây không phải thống kê toàn bộ lịch sử thế giới.</div>
    <div style="margin-top:5px;line-height:1.5;"><b>Cuộc gặp:</b> gọi ${total('conversation:attempted:')} · hoàn tất ${total('conversation:completed:')} · bỏ qua ${total('conversation:skipped:')}.</div>
    <div style="margin-top:4px;line-height:1.5;"><b>Quét cộng đồng:</b> đầu vào ${count('community_scan:input_pairs:')} lượt cặp · không ở gần/thiếu vị trí ${count('community_scan:excluded_non_near_pairs:')} · cặp gần trùng ${count('community_scan:duplicate_near_pairs:')} · còn thời gian chờ ${count('community_scan:filtered_cooldown:')} · gọi hội thoại ${count('community_scan:commit_calls:')}.</div>
    <div style="margin-top:4px;line-height:1.5;"><b>Kế hoạch nghỉ/giao lưu:</b> bắt đầu ${total('social_plan:started:')} · hoàn tất ${total('social_plan:completed:')} · thất bại ${total('social_plan:failed:')} · bị thay ${total('social_plan:interrupted:')}. Hoàn tất kế hoạch nghỉ chưa đồng nghĩa đã trò chuyện.</div>
    <div style="margin-top:4px;"><b>Tích lũy tín nhiệm:</b> ${total('familiarity:rewarded:')} lần thưởng theo từng phía; không phải số cặp.</div>
    <div style="color:#8b949e;margin:4px 0;">Đầu vào có thể lặp giữa cụm; cặp bị lọc chưa phải một hội thoại. Counter có thể thiếu khi hết giới hạn key; mẫu chỉ là cửa sổ gần nhất. Các kế hoạch còn chạy, đã chết hoặc thiếu hook kết thúc không được suy thành thất bại.</div>
    ${counts.map(([key, value]) => `<div>${escape(key)}: ${value}</div>`).join('') || '<div>Chưa có số liệu.</div>'}
    ${data.samples.slice(0, 10).map(sample => `<div>Ngày ${formatDays(sample.day)} · #${sample.actor}${sample.target ? ` → #${sample.target}` : ''}${sample.planRevision !== undefined ? ` · kế hoạch ${sample.planRevision}` : ''}: ${escape(sample.category)} / ${escape(sample.result)} ${escape(sample.detail ?? '')}</div>`).join('')}`}
  </details>`;
}
