// RC16 member-archive preview: honest, device-local and fully trilingual.
(function(host){
  'use strict';
  const rows=[
    ['No account needed to begin','Aucun compte nécessaire pour commencer','开始体验无需账号'],
    ['05 / THE CERCLE ARCHIVE','05 / LES ARCHIVES DU CERCLE','05 / CERCLE 私享档案'],
    ['Your readings are kept on this device. Sign in or join MARÉVYS CERCLE to reopen the symbols, questions and rituals you chose to keep.','Vos lectures restent sur cet appareil. Connectez-vous ou rejoignez le CERCLE MARÉVYS pour retrouver les symboles, questions et rituels que vous avez choisi de conserver.','你的解读记录保存在此设备上。登录或加入 MARÉVYS CERCLE，即可再次查看你选择保留的符号、问题与仪式。'],
    ['The account gate is an interactive preview. It does not create an account, transmit an email address or synchronize your records.','Cet accès membre est une démonstration interactive. Il ne crée aucun compte, ne transmet aucune adresse e-mail et ne synchronise pas vos archives.','会员入口目前为交互式演示，不会创建真实账号、发送邮箱地址或同步你的记录。'],
    ['Unlock my archive','Déverrouiller mes archives','解锁我的档案'],
    ['CERCLE MEMBER ARCHIVE','ARCHIVES DES MEMBRES DU CERCLE','CERCLE 会员档案'],
    ['The current reading preview is free and needs no account to begin. The personal archive demonstrates a future member feature: sign in or join CERCLE to reopen past readings.','L’expérience de lecture actuelle est gratuite et ne demande aucun compte pour commencer. Les archives personnelles présentent une future fonction membre : connectez-vous ou rejoignez le CERCLE pour retrouver vos lectures passées.','当前解读体验免费，开始时无需账号。个人档案展示未来的会员功能：登录或加入 CERCLE 后，可以重新查看过往解读。'],
    ['In this preview they remain only in this browser on this device. The member gate demonstrates future access but does not create a cloud account or synchronization. Clearing browser data or using a private session may remove them.','Dans cet aperçu, vos données restent uniquement dans ce navigateur, sur cet appareil. L’accès membre illustre un futur parcours sans créer de compte en ligne ni de synchronisation. Effacer les données du navigateur ou utiliser la navigation privée peut les supprimer.','在当前预览版中，它们仅保存在此设备的当前浏览器中。会员入口只是未来访问方式的演示，不会创建云端账号或进行同步。清除浏览器数据或使用隐私模式可能会删除这些记录。'],
    ['Yes. Completed readings from all three systems can be saved on this device with your reflection. Reopening the archive passes through the CERCLE member preview.','Oui. Les lectures achevées dans les trois systèmes peuvent être conservées sur cet appareil avec votre réflexion. La réouverture des archives passe par l’aperçu de l’accès membre CERCLE.','可以。三种体系中完成的解读都能连同你的感悟保存在此设备上；再次打开档案时，会进入 CERCLE 会员访问演示。'],
    ['Three symbolic reading systems · One guided path · No account needed to begin','Trois systèmes symboliques · Un parcours guidé · Aucun compte nécessaire pour commencer','三种象征体系 · 一条引导式动线 · 开始体验无需账号'],
    ['This reading is kept on this device. Join CERCLE or use the member sign-in preview to reopen it later.','Cette lecture reste sur cet appareil. Rejoignez le CERCLE ou utilisez l’aperçu de connexion membre pour la retrouver plus tard.','本次解读已保存在此设备上。加入 CERCLE 或使用会员登录演示，即可日后再次查看。'],
    ['This reading, its ritual and your own words are kept on this device. Join CERCLE or use the member sign-in preview to reopen them later.','Cette lecture, son rituel et vos propres mots restent sur cet appareil. Rejoignez le CERCLE ou utilisez l’aperçu de connexion membre pour les retrouver plus tard.','本次解读、匹配仪式与你写下的文字都保存在此设备上。加入 CERCLE 或使用会员登录演示，即可日后再次查看。'],
    ['MARÉVYS CERCLE','CERCLE MARÉVYS','MARÉVYS CERCLE'],
    ['ON-DEVICE ARCHIVE PREVIEW','APERÇU DES ARCHIVES SUR CET APPAREIL','本设备档案预览'],
    ['Your archive is ready.','Vos archives sont prêtes.','你的档案已准备就绪。'],
    ['Revisit every reading you chose to keep','Retrouvez chaque lecture que vous avez choisi de conserver','重温每一份你选择保留的解读'],
    ['Receive one considered ritual each week','Recevez chaque semaine un rituel choisi avec soin','每周收到一套经过精心设计的仪式'],
    ['Discover limited objects before release','Découvrez les objets en édition limitée avant leur lancement','优先探索尚未发布的限量器物'],
    ['MEMBER ACCESS · INTERACTIVE PREVIEW','ACCÈS MEMBRE · APERÇU INTERACTIF','会员访问 · 交互式演示'],
    ['Join the Cercle to keep your readings close.','Rejoignez le Cercle pour garder vos lectures à portée de main.','加入 CERCLE，让你的解读始终触手可及。'],
    ['CERCLE membership is designed to turn one reading into a private archive, a weekly ritual and early access to limited objects.','L’adhésion au CERCLE est pensée pour prolonger une lecture en archives privées, en rituel hebdomadaire et en accès anticipé aux objets en édition limitée.','CERCLE 会员服务旨在将一次解读延续为私享档案、每周仪式，以及限量器物的优先体验。'],
    ['Choose member access','Choisir le mode d’accès membre','选择会员访问方式'],
    ['Join CERCLE','Rejoindre le CERCLE','加入 CERCLE'],
    ['Member sign in','Connexion membre','会员登录'],
    ['Preview joining the Cercle','Aperçu de l’adhésion au Cercle','演示加入 CERCLE'],
    ['Prototype note.','Note sur le prototype.','原型说明。'],
    ['This demonstration neither sends nor stores your email. No account or subscription is created; access lasts only for this page visit.','Cette démonstration n’envoie ni ne conserve votre adresse e-mail. Aucun compte ni abonnement n’est créé ; l’accès ne dure que pendant cette visite de la page.','此演示不会发送或存储你的邮箱，不会创建真实账号或订阅；访问权限仅在本次页面浏览期间有效。'],
    ['How your records are handled →','Comment vos archives sont traitées →','了解记录的处理方式 →'],
    ['CERCLE MEMBER VIEW · PREVIEW ONLY','ESPACE MEMBRE CERCLE · APERÇU UNIQUEMENT','CERCLE 会员视图 · 仅供演示'],
    ['End preview access','Quitter l’aperçu membre','退出会员演示'],
    ['Your saved readings and wishlist stay in this browser. Member access is simulated in this preview.','Vos lectures enregistrées et votre liste d’envies restent dans ce navigateur. L’accès membre est simulé dans cet aperçu.','已保存的解读与心愿单保留在当前浏览器中；会员访问在此预览版中为模拟体验。'],
    ['Your archive is ready for its first reading.','Vos archives sont prêtes à accueillir leur première lecture.','你的档案已准备好收录第一份解读。'],
    ['One saved reading is waiting on this device.','Une lecture enregistrée vous attend sur cet appareil.','此设备上已有一份解读等待你查看。'],
    ['{count} saved readings are waiting on this device.','{count} lectures enregistrées vous attendent sur cet appareil.','此设备上已有 {count} 份解读等待你查看。'],
    ['MEMBER ARCHIVE','ARCHIVES MEMBRES','会员档案'],
    ['Your on-device archive preview.','Aperçu de vos archives sur cet appareil.','你的本设备档案预览。'],
    ['READINGS','LECTURES','解读'],
    ['RITUALS','RITUELS','仪式'],
    ['EARLY ACCESS','ACCÈS ANTICIPÉ','优先体验'],
    ['Return to your private reading archive.','Retrouvez vos archives de lectures privées.','返回你的私享解读档案。'],
    ['Member sign-in will reopen the readings and rituals saved on this device.','La connexion membre rouvrira les lectures et rituels enregistrés sur cet appareil.','会员登录将重新打开保存在此设备上的解读与仪式。'],
    ['Preview member sign-in','Aperçu de la connexion membre','演示会员登录'],
    ['Enter an email address to continue.','Saisissez une adresse e-mail pour continuer.','请输入邮箱地址后继续。'],
    ['Member archive unlocked for this preview only. No account or subscription was created.','Archives membres déverrouillées uniquement pour cet aperçu. Aucun compte ni abonnement n’a été créé.','会员档案已在本次演示中解锁，没有创建真实账号或订阅。'],
    ['Member preview access ended. Your local readings were not deleted.','L’accès à l’aperçu membre est terminé. Vos lectures locales n’ont pas été supprimées.','会员演示访问已结束，你保存在本地的解读没有被删除。']
  ];
  if(!Array.isArray(host.MAREVYS_TEXT))host.MAREVYS_TEXT=[];
  host.MAREVYS_TEXT.push(...rows);
  host.MAREVYS_RC16_GATE_TEXT=rows;
})(typeof window==='undefined'?globalThis:window);
