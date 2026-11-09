type Reading = {
  meaning: string;
  advice: string;
  reversedMeaning: string;
  reversedAdvice: string;
};

const readings: Record<string, Reading> = {
  愚人: { meaning: "一头扎进未知的勇气，和一份全新的开始", advice: "允许自己从一个很小的尝试开始，不必先想完所有后果。", reversedMeaning: "准备还不足就往前冲，或因为害怕而迟迟不动", reversedAdvice: "先补上一个必要的准备，再决定要不要迈出那一步。" },
  魔术师: { meaning: "你已经握着需要的工具，缺的是把它们用起来", advice: "选定一件事，把时间和注意力都放在它上面。", reversedMeaning: "力气有些散，工具在手上却还没对准目标", reversedAdvice: "先收起多余的选项，只保留一个今天能完成的动作。" },
  女祭司: { meaning: "安静、直觉，以及先观察再判断", advice: "少做结论，把还不确定的问题记下来。", reversedMeaning: "想得太多，却不肯核对眼前的事实", reversedAdvice: "找一条能核对的信息，用它校正自己的猜测。" },
  皇后: { meaning: "滋养、创造，以及让事情慢慢长出来", advice: "照顾一个已经开始的成果，给它继续生长的时间。", reversedMeaning: "照顾计划过了头，自己先被掏空", reversedAdvice: "先留一点时间给自己的状态，再继续产出。" },
  皇帝: { meaning: "秩序、边界，和把事情安放好", advice: "把要做的事排成清楚的顺序，一次只推进一件。", reversedMeaning: "控制太紧，或结构松了以至于事情散开", reversedAdvice: "放松一条不必要的规矩，同时守住最重要的那件。" },
  教皇: { meaning: "可遵循的方法，以及从已有经验里学习", advice: "沿着一套现成的步骤练习，不另起一套新做法。", reversedMeaning: "被旧规矩卡住，或一味拒绝已有的方法", reversedAdvice: "分辨哪一条规则还对你有用，哪一条可以放下。" },
  恋人: { meaning: "一次真心的选择，以及你真正想走的那条路", advice: "明确今天最想保留的一件事，暂时放下并列的分心。", reversedMeaning: "选择含糊，容易被别的诱惑拉走", reversedAdvice: "写下你真正在意的标准，用它做今天的取舍。" },
  战车: { meaning: "把分散的力气收成一个方向往前", advice: "给自己定一个明确的停止点，一路做到那里。", reversedMeaning: "方向在拉扯，推得很累却没有前进", reversedAdvice: "先停下来对齐目标，再重新出发。" },
  力量: { meaning: "温柔而稳定的坚持，不靠硬扛", advice: "用耐心处理最难的那一小段，不跟自己较劲。", reversedMeaning: "力气用过了头，或者对自己失去耐心", reversedAdvice: "把任务再缩小一档，用能维持的力度做完。" },
  隐者: { meaning: "独处、内省，以及自己找路", advice: "留出一段不被打扰的时间，只问自己下一步要什么。", reversedMeaning: "孤立太久，或逃避本该面对的问题", reversedAdvice: "找一个你信任的人，交换一个具体问题。" },
  命运之轮: { meaning: "变化正在发生，有的到来，有的离开", advice: "顺着已经出现的变化调整安排，不硬守旧计划。", reversedMeaning: "感觉被变化拖着走，节奏乱了", reversedAdvice: "抓住一件仍然由你决定的小事，把它做稳。" },
  正义: { meaning: "诚实、权衡，以及按事实做判断", advice: "把含糊的事项写成可以核对的结论。", reversedMeaning: "判断偏了，或还缺少关键事实", reversedAdvice: "先补上一条证据，再决定站在哪一边。" },
  倒吊人: { meaning: "换一个角度，暂停本身也是一种推进", advice: "先别赶进度，看看有没有更省力的做法。", reversedMeaning: "停滞变成了拖延，迟迟不肯换方法", reversedAdvice: "给这次暂停一个结束时间，到点就做一个小决定。" },
  死神: { meaning: "一段旧安排可以结束，好把位置让出来", advice: "关掉一个不再重要的事项，把精力留给还想继续的事。", reversedMeaning: "知道该结束，却还抓着不放", reversedAdvice: "只结束其中最小的一块，让放手变得做得到。" },
  节制: { meaning: "把两边调和到刚刚好，节奏比极端更有用", advice: "在用力和休息之间留出过渡，不走极端。", reversedMeaning: "要么过满，要么完全停住，中间没有缓冲", reversedAdvice: "把今天的量调回你能稳定完成的程度。" },
  恶魔: { meaning: "被习惯、焦虑或欲望牵着走", advice: "认出一个让你停不下来的模式，只改其中一小步。", reversedMeaning: "开始看见这条束缚，松动已经出现", reversedAdvice: "把这个模式打断一次，用另一个具体动作替换它。" },
  塔: { meaning: "旧的结构松动了，突然的变化需要先稳住", advice: "先守住一件最基础的事，再处理冒出来的变化。", reversedMeaning: "动摇还在延续，或者你在躲开必要的调整", reversedAdvice: "承认哪一块已经不稳，给它一个临时的支撑。" },
  星星: { meaning: "希望、恢复，以及重新看见方向", advice: "做一件能让自己恢复信心的小事，并且把它做完。", reversedMeaning: "信心变淡，觉得努力暂时看不见回声", reversedAdvice: "只保留一个仍然让你感到值得的小目标。" },
  月亮: { meaning: "事情还不明朗，想象容易盖过事实", advice: "只处理能确认的部分，不确定的先标出来。", reversedMeaning: "迷雾慢慢散开，但还容易被情绪带着走", reversedAdvice: "用一条具体事实核对你的担心。" },
  太阳: { meaning: "明朗、可见的进展，适合把成果拿出来", advice: "把已经做好的部分清楚地看见，或拿给别人看。", reversedMeaning: "光还在，只是被暂时挡住，成就感来得慢", reversedAdvice: "先肯定一个已经完成的细节，再继续往下做。" },
  审判: { meaning: "回顾、召唤，以及给过去一个新的评价", advice: "复盘一件做过的事，决定要保留还是重来。", reversedMeaning: "迟迟不肯做评价，旧的自我判断还压着你", reversedAdvice: "只复盘一个片段，写下你现在愿意怎么看它。" },
  世界: { meaning: "一个循环可以收束，完整比继续加码更重要", advice: "把进行中的一件事收尾，并写下下一步。", reversedMeaning: "差最后一点就完整，却还在拖延收尾", reversedAdvice: "列出还缺的那一项，今天只补上它。" },
  权杖1: { meaning: "行动上的新火花，一件事值得开始", advice: "把灵感落成一个 25 分钟就能动手的小动作。", reversedMeaning: "想启动，但火候还没到，或热情来得太冲", reversedAdvice: "先写清要开始的那一件，再决定今天做不做。" },
  权杖2: { meaning: "站在已有的基础上，望向下一步", advice: "从两件都想做的事里选定今天先走的那条。", reversedMeaning: "计划很多，人却还停在原地", reversedAdvice: "把远景收成一个今天能离开书桌去完成的步骤。" },
  权杖3: { meaning: "已经出发，正在等第一批结果回来", advice: "继续推进已经发出去的那件事，同时准备下一步。", reversedMeaning: "进展比预期慢，容易怀疑当初的方向", reversedAdvice: "核对一个已经发生的进展，再决定要不要调整。" },
  权杖4: { meaning: "一个阶段可以先安顿下来，庆祝稳住的部分", advice: "把今天的进度收在一个清楚的节点，留出休息。", reversedMeaning: "安定变成了停滞，或者家里的节奏被打乱", reversedAdvice: "先恢复一个让你站得住的小仪式，再继续赶工。" },
  权杖5: { meaning: "不同想法在较劲，冲突里也有活力", advice: "把争论收成一个可以比较的问题，不在情绪里打转。", reversedMeaning: "内耗或回避冲突，力气耗在拉扯上", reversedAdvice: "退出一场没有结论的争辩，回到你自己的任务。" },
  权杖6: { meaning: "被看见的进展，以及带着信心继续往前", advice: "把已经做成的一小步说出来，让它成为下一步的底气。", reversedMeaning: "在意评价超过了事情本身，信心有些不稳", reversedAdvice: "少看外界反应，先把下一段自己能做的事做完。" },
  权杖7: { meaning: "需要守住自己的位置，一次只挡一件事", advice: "列出今天真正要防守的那一件，其余先放下。", reversedMeaning: "招架太多，觉得四面都是压力", reversedAdvice: "退出一个不必要的战场，把力气留给主线。" },
  权杖8: { meaning: "事情加速，消息和行动都会很快到来", advice: "趁势把一件已经清楚的事一次做完，少中途改道。", reversedMeaning: "太赶，或者该快的时候反而卡住了", reversedAdvice: "只加速一件事，其余保持原来的节奏。" },
  权杖9: { meaning: "已经撑过一段，剩下的是守住最后的边界", advice: "保留体力，只完成还差的那一点，不追加新任务。", reversedMeaning: "防备过了头，累是因为不肯放下戒心", reversedAdvice: "承认自己已经做得够多，今天给恢复留出位置。" },
  权杖10: { meaning: "扛了很多，责任已经堆到需要卸下一截", advice: "从背上拿掉一件不是今天必须的事。", reversedMeaning: "负担还在，但你开始知道有些可以交出去", reversedAdvice: "把一件事交给别人，或明确推迟到明天。" },
  权杖11: { meaning: "好奇和试探，像学徒一样先碰一碰新领域", advice: "用很短的时间探索一个新做法，不要求立刻熟练。", reversedMeaning: "消息杂、新鲜感散，学了却没留下", reversedAdvice: "只跟进一条新信息，并写下你从中得到的一点。" },
  权杖12: { meaning: "冲劲正盛，适合把热情用在一件具体的推进上", advice: "挑一件你有干劲的事，设定一个做到为止的时间。", reversedMeaning: "冲得太快，方向或脾气都容易过火", reversedAdvice: "出发前先写下一句目的，避免只是猛冲。" },
  权杖13: { meaning: "稳定的热情，能鼓舞自己也照亮正在做的事", advice: "用你已经熟悉的方式，把一件事做得让自己满意。", reversedMeaning: "热情被消耗，对自己做的事提不起劲", reversedAdvice: "先做一件能重新感到热乎的小事，再回到主线。" },
  权杖14: { meaning: "对行动有掌握，可以做决定并带方向", advice: "今天由你拍板一件事，并把它安排进具体时间。", reversedMeaning: "掌控欲太强，或该做的决定一直拖着", reversedAdvice: "只做一个小决定，并告诉自己到此为止。" },
  圣杯1: { meaning: "情感与直觉上的新开始，一种被充满的感觉", advice: "先做一件让自己真正愿意投入的小事。", reversedMeaning: "情感有些堵住，灵感还没流出来", reversedAdvice: "少逼自己兴奋，先把一件具体的小事做完。" },
  圣杯2: { meaning: "对等的连接，两个人或两件事可以互相成全", advice: "找一个能和你配合的人，一起把一件小事往前送。", reversedMeaning: "关系或合作有些错位，付出没有对上", reversedAdvice: "先说清你需要的是什么，再决定要不要继续配合。" },
  圣杯3: { meaning: "分享成果，和让别人一起感到完成", advice: "把今天的一个进展告诉朋友，或自己好好记一笔。", reversedMeaning: "表面热闹，内心却没什么被满足", reversedAdvice: "少参加分散注意的聚会，留时间给真正在意的事。" },
  圣杯4: { meaning: "眼前的选择提不起劲，注意力在别处", advice: "先承认自己倦了，再看看有没有被忽略的那个机会。", reversedMeaning: "冷淡开始松动，你愿意重新看一眼眼前的事", reversedAdvice: "给一件原本想推开的事十分钟，再决定去留。" },
  圣杯5: { meaning: "注意力停在失去的部分，旁边仍有留下的", advice: "允许自己难受一会儿，然后转去照看还在的那一件。", reversedMeaning: "难过慢慢过去，开始能看见剩下的支持", reversedAdvice: "写下还拥有的一个资源，今天就用它做一点事。" },
  圣杯6: { meaning: "熟悉的温暖、旧日的方法，或一份单纯的善意", advice: "用一个你本来就会的方式开始，不必追求全新。", reversedMeaning: "困在过去的做法里，或对旧事过分留恋", reversedAdvice: "保留有用的旧经验，放下一个已经不适用的习惯。" },
  圣杯7: { meaning: "选项很多，想象很满，需要从幻象里挑一个真的", advice: "把幻想收成一个今天真的会做的选择。", reversedMeaning: "看清了哪些只是想象，迷惑在减退", reversedAdvice: "划掉两个不会做的选项，只留下一个。" },
  圣杯8: { meaning: "知道该离开不再满足你的安排", advice: "放下一件已经没有感觉的任务，走向更在意的事。", reversedMeaning: "想离开又犹豫，或离开之后还反复回头", reversedAdvice: "先暂停那件事半天，看看心情有没有变轻。" },
  圣杯9: { meaning: "愿望有了着落，适合享受已经得到的满足", advice: "给自己一个小的奖励，并确认今天到这里就够了。", reversedMeaning: "得到了却不满足，或快乐建立在不太踏实的期待上", reversedAdvice: "把标准放回一件真实完成的事，而不是更多的想要。" },
  圣杯10: { meaning: "情感上的完整，和一种可以安放下来的归属", advice: "把今天的安排照顾到关系和自己两边，不只顾产出。", reversedMeaning: "表面的和谐底下还有没说完的话", reversedAdvice: "挑一件小的不痛快说清楚，而不是假装没事。" },
  圣杯11: { meaning: "柔软的新消息，直觉带来一个值得倾听的信号", advice: "记下今天突然在意的那句话，看看它指向什么。", reversedMeaning: "情绪化的消息容易把你带偏", reversedAdvice: "先放一放那条让你心软或心烦的信息，晚一点再回。" },
  圣杯12: { meaning: "跟着感觉往前，邀请和情感都会来得比较直接", advice: "对一件让你心动的事给出明确回应，去或不去。", reversedMeaning: "情绪冲在前面，承诺容易超过你真的想给的", reversedAdvice: "先别答应新的情感或额外负担，回到已经在做的事。" },
  圣杯13: { meaning: "情感上的成熟，能接住自己的感受也不被淹没", advice: "用温和的方式处理一件在意的事，照顾到感受和事实。", reversedMeaning: "情绪照看不到位，容易委屈或过度付出", reversedAdvice: "先问自己需要什么，再去照顾别人的需求。" },
  圣杯14: { meaning: "情感上的稳定和分寸，可以平静地做判断", advice: "在心情平稳的时候决定一件事，并照这个决定去做。", reversedMeaning: "情绪压着判断，冷漠或失控都可能出现", reversedAdvice: "等心情落下来再回复重要的事，先做一件中性的任务。" },
  宝剑1: { meaning: "一个清楚的想法，适合把真相说破或写下来", advice: "用一句话写清今天要解决的核心问题。", reversedMeaning: "想法很利，但容易伤人，或真理还没想完整", reversedAdvice: "先把判断写给自己看，不急着抛出去。" },
  宝剑2: { meaning: "两边都看见了，却还不肯做出选择", advice: "给自己一个决定的时限，到点就选一边。", reversedMeaning: "僵持松动了，信息开始足够做选择", reversedAdvice: "拿掉一个干扰，让真正的选项露出来。" },
  宝剑3: { meaning: "失望或心痛需要被承认，硬撑只会更累", advice: "把难受写下来，然后只安排一件今天仍能做的小事。", reversedMeaning: "伤痛在恢复，但还没完全过去", reversedAdvice: "少反复想那件让你痛的事，把注意力放到一个具体动作上。" },
  宝剑4: { meaning: "需要真正休息，脑子要先停下来", advice: "安排一段不处理消息的休息，醒来再继续。", reversedMeaning: "休息不够，或休息变成了逃避", reversedAdvice: "先补一个短休息，再回到最小的那项任务。" },
  宝剑5: { meaning: "赢了争论却伤了关系，或心里还在较劲", advice: "退出一场没有必要分胜负的比较。", reversedMeaning: "愿意停战，把面子放下", reversedAdvice: "向自己或对方承认一个过了头的判断。" },
  宝剑6: { meaning: "离开混乱，把注意力渡到更平静的一边", advice: "从一个让你烦的环境或话题里抽身，去做安静的工作。", reversedMeaning: "还没完全离开旧的困扰，行李还背在身上", reversedAdvice: "只处理一件还缠着你的事，其余先放到明天。" },
  宝剑7: { meaning: "有些事想绕开，策略和诚实需要一起看", advice: "用直接的方式处理一件你原本想回避的小事。", reversedMeaning: "隐瞒变得累，真相快藏不住", reversedAdvice: "把一件没说清的事实补上，哪怕只告诉自己。" },
  宝剑8: { meaning: "觉得被卡住，很多限制其实来自自己的想法", advice: "找出一个你以为不能做、其实可以试的小步骤。", reversedMeaning: "束缚在松开，你开始看见出口", reversedAdvice: "走一步你刚才还觉得不可能的小动作。" },
  宝剑9: { meaning: "担忧在夜里变大，事实往往比想象小", advice: "把担心写成一张清单，只处理其中一件能核对的。", reversedMeaning: "焦虑松了一些，但还容易往最坏处想", reversedAdvice: "用一个现实里的进展，替换脑中的最坏设想。" },
  宝剑10: { meaning: "一种想法或安排已经到底，硬撑没有好处", advice: "结束一个明显做不下去的做法，允许这件事告一段落。", reversedMeaning: "最难的部分过去了，恢复刚刚开始", reversedAdvice: "不要立刻重开旧题，先做一件让身体放松的事。" },
  宝剑11: { meaning: "新的想法、问题和想弄清楚的好奇心", advice: "提出一个具体问题，并去找一个来源回答它。", reversedMeaning: "消息零碎，容易捕风捉影", reversedAdvice: "先核对来源，再决定要不要跟着这条信息行动。" },
  宝剑12: { meaning: "想得快、行动也快，适合直奔一个清楚的目标", advice: "选定一个问题，一路想完并写出结论。", reversedMeaning: "说话或决定太冲，容易事后后悔", reversedAdvice: "发出去之前先放几分钟，再读一遍你的结论。" },
  宝剑13: { meaning: "头脑清楚，能独立看清局面并划出边界", advice: "用不带情绪的方式整理一件复杂的事。", reversedMeaning: "太尖锐，或因为想太多而冷下来", reversedAdvice: "结论之外，补一句你自己的感受，避免只剩判断。" },
  宝剑14: { meaning: "理性的权威，适合做清晰、公正的决定", advice: "按原则而不是按心情，定下一件今天的事。", reversedMeaning: "想法僵硬，或用理智压住了该听的感受", reversedAdvice: "在决定前问自己一句：这样对今天的我是否过重。" },
  星币1: { meaning: "一个实际的新机会，可以从手头的资源长出来", advice: "把一个想法落到能看见的成果上，哪怕只做一小块。", reversedMeaning: "机会在，但落地的步子还虚，或太计较得失", reversedAdvice: "先做一个不完美的实物草稿，再谈值不值得。" },
  星币2: { meaning: "手里有好几件事，需要灵活地倒换重心", advice: "把今天的两件主线排好先后，中间留一点缓冲。", reversedMeaning: "兼顾失败，事情开始互相挤兑", reversedAdvice: "暂时放下其中一件，保证另一件做完。" },
  星币3: { meaning: "和别人一起把技艺用在同一件作品上", advice: "找一个能互补的人，或按已有的标准把一块做扎实。", reversedMeaning: "配合不齐，作品的质量被拖住", reversedAdvice: "先对齐一个具体标准，再继续往下做。" },
  星币4: { meaning: "抓住已有的成果，稳定比扩张更重要", advice: "巩固一件已经做完的事，把它整理到以后找得到。", reversedMeaning: "抓得太紧，舍不得用手上的资源", reversedAdvice: "放开一个囤着没用的材料或任务，让它流动起来。" },
  星币5: { meaning: "资源或信心暂时不足，需要务实地求助", advice: "承认缺的那一块，向一个具体的来源寻求帮助。", reversedMeaning: "匮乏感还在，但支持开始能被看见", reversedAdvice: "接受一个现成的帮助，或先用手头最小的资源开工。" },
  星币6: { meaning: "给予和接受可以平衡，资源正在流动", advice: "把你已经会的一点分享出去，或收下别人给的帮助。", reversedMeaning: "付出和回报没对上，心里有本账", reversedAdvice: "说清这次帮忙的边界，避免默默透支。" },
  星币7: { meaning: "种子已经种下，需要耐心等它长，而不是天天挖开看", advice: "复盘目前的进度，然后留时间让它继续，不追加动作。", reversedMeaning: "等得不耐烦，或怀疑投入是否值得", reversedAdvice: "只检查一个指标，确认它还在增长就先停手。" },
  星币8: { meaning: "把手艺磨熟，重复练习本身就是进展", advice: "选一项技能，认真做一轮专注的练习。", reversedMeaning: "重复变成了机械，手在做、心不在", reversedAdvice: "给练习加一个小的质量标准，做完就停。" },
  星币9: { meaning: "靠自己的积累站稳，可以享受独立的成果", advice: "独立完成一件能看见成品的事，并把它留存下来。", reversedMeaning: "什么都想自己扛，成果反而变慢", reversedAdvice: "允许一件事不必完美独立，借用一个现成工具。" },
  星币10: { meaning: "长期的积累有了稳定的样子，适合看整段路程", advice: "把一件长期事项整理出现状，确认它还在你的大方向上。", reversedMeaning: "传统或旧计划压着你，稳定变成了负担", reversedAdvice: "改掉长期计划里一个已经不适用的部分。" },
  星币11: { meaning: "想学一门实际的技能，或收到一个落地的新消息", advice: "今天学一个能马上用上的小技巧，并试一次。", reversedMeaning: "学习停在收藏，没有动手", reversedAdvice: "关掉多余的资料，只练习刚刚看到的那一个点。" },
  星币12: { meaning: "稳步推进实际事务，慢但可靠", advice: "按清单把一件具体的事务做完，不追求速度。", reversedMeaning: "太慢、太固执，或对变化缺乏回应", reversedAdvice: "在稳的前提下，把其中一步提前完成。" },
  星币13: { meaning: "把资源照顾好，让日常变得丰盛、可依靠", advice: "整理一个实际的环境或材料，让接下来更好做事。", reversedMeaning: "照顾物质或日程过了头，忽略了自己的节奏", reversedAdvice: "简化一项日常安排，留出不被占满的时间。" },
  星币14: { meaning: "对实际事务有掌握，能做稳妥、长期的决定", advice: "为一个具体目标定下今天的投入，并记录结果。", reversedMeaning: "过于保守，或用控制代替真正的经营", reversedAdvice: "在稳妥之外，允许一个小的实际尝试。" }
};

export function describeTarotCard(name: string, orientation: string = "正位") {
  const entry = readings[name];
  if (!entry) return `${name}代表先看清今天真正要推进的一件事，建议今天把它写成一个能完成的小步骤。`;
  const reversed = orientation === "逆位";
  const meaning = reversed ? entry.reversedMeaning : entry.meaning;
  const advice = reversed ? entry.reversedAdvice : entry.advice;
  return `${name}代表${meaning}，建议今天${advice}`;
}
