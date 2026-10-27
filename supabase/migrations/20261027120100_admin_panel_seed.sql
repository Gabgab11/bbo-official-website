-- Initial content: the site as it was before the admin panel existed.
insert into public.site_content (key, value) values
('hero', jsonb_build_object(
  'fullName', 'Bakare Boluwatife Oluwatobi',
  'headline', 'Worship that stirs people to pray.')),
('featured', jsonb_build_object(
  'title', 'Renewed Faith',
  'description', 'The project at the centre of this season of BBO’s ministry. Stream it alongside his full catalogue on Spotify.',
  'href', 'https://open.spotify.com/artist/2uaQ0i7hnhD1rRwDOSCkOd')),
('about', jsonb_build_object(
  'title', 'A sound born in prayer',
  'paragraphs', jsonb_build_array(
    'Bakare Boluwatife Oluwatobi, known to congregations as BBO, is a gospel music minister, worship leader and songwriter from Ijebu in Ogun State, Nigeria. His music joins the depth of Yoruba praise with the textures of contemporary worship, and his ministrations are known for turning a room toward prayer.',
    'Before music became his calling, BBO worked as a compère and actor. That changed in 2020. During the COVID-19 lockdown he gave himself to prayer and worship, and *Most High*, shared in that season, carried his voice far beyond his city and introduced him to gospel audiences across Nigeria.',
    'He has since ministered on major gospel stages at home and abroad, including Tope Alabi’s Praise The Almighty in the United Kingdom, and recorded with Tope Alabi, Woli Arole, Oladosu Twins and Testimony Jaga. His catalogue moves between studio singles such as *My God*, *ORO* and *Orun Si*, live worship albums, and long, unhurried sessions of spontaneous worship.'),
  'quote', 'One of my deepest desires is to see Jesus manifest through my music.',
  'quoteSource', 'ThisDay, October 2024',
  'quoteHref', 'https://www.thisdaylive.com/2024/10/31/one-of-my-deepest-desires-is-to-see-jesus-manifest-through-my-music-bbo/')),
('booking', jsonb_build_object(
  'title', 'Invite BBO to minister',
  'lede', 'Tell us about your church service, concert, conference or celebration. Every request is read by BBO’s team, who reply by email.')),
('newsletter', jsonb_build_object(
  'title', 'Stay close to the ministry',
  'lede', 'New releases, upcoming ministrations and live recordings, sent occasionally by email.'));

insert into public.gallery_photos (kind,ref,width,height,alt,in_gallery,gallery_sort,on_home,home_sort,home_mono,pos,pos_mobile) values
('static','bbo-smile',1600,1209,'BBO smiling with eyes closed, in a white shirt',true,0,true,1,true,'58% 30%','56% 22%'),
('static','ab7e7d_12ab11c2dc364f38901d43f505eb9a31~mv2.jpg',980,502,'BBO ministering',true,1,false,0,false,null,null),
('static','ab7e7d_3c1a95e1fc1a4e2a9cab933dd1b144a1~mv2.jpg',648,432,'BBO ministering',true,2,false,0,false,null,null),
('static','bbo-silhouette',1080,1350,'Silhouette of BBO in profile, smiling, holding a horsetail whisk',true,3,true,2,false,'55% 30%','58% 20%'),
('static','ab7e7d_035129c976f84c27b1db35cb11f49765~mv2.jpg',642,502,'BBO ministering',true,4,false,0,false,null,null),
('static','ab7e7d_d812564559f0427ba3482ea8c2e03401~mv2.jpg',980,502,'BBO ministering',true,5,false,0,false,null,null),
('static','ab7e7d_2192af33ab164049aab3f9a114fa544d~mv2.jpg',855,502,'BBO ministering',true,6,false,0,false,null,null),
('static','bbo-veil',1600,2000,'BBO veiled in white cloth, a band of light across one eye',true,7,true,3,false,'52% 38%','52% 30%'),
('static','ab7e7d_84c78c5780e14559a01ed0ee37f833ac~mv2.jpg',846,502,'BBO ministering',true,8,false,0,false,null,null),
('static','ab7e7d_64e00f7afb22434a904d425f6120061f~mv2.jpg',980,502,'BBO ministering',true,9,false,0,false,null,null),
('static','ab7e7d_1d9d8e4433d342ac9eb09b251917f0ff~mv2.jpg',980,502,'BBO ministering',true,10,false,0,false,null,null),
('static','ab7e7d_76c28687ba34400a81a25dad29d88e35~mv2.jpg',800,991,'BBO in traditional attire, lit in red',true,11,false,0,false,null,null),
('static','ab7e7d_1c1defb8467143319b8a8e8916e70a99~mv2.jpg',860,502,'BBO ministering',true,12,false,0,false,null,null),
('static','ab7e7d_75b1fa8c94d9461e9044722395fae470~mv2.jpg',720,502,'BBO ministering',true,13,false,0,false,null,null),
('static','ab7e7d_cd65a113d0c84f75a1b74ab1189a03e8~mv2.jpg',864,502,'BBO ministering',true,14,false,0,false,null,null),
('static','ab7e7d_5cdf3f8596614503aad1a14ba318908f~mv2.jpg',738,923,'BBO in traditional agbada, holding a carved staff',false,0,true,0,false,'50% 20%','50% 14%'),
('static','ab7e7d_22f0357b7be446a29f4612dad1008b39~mv2.jpg',800,985,'Black-and-white portrait of BBO in a white shirt',false,0,true,4,false,'50% 22%','50% 16%');
insert into public.releases (title,credit,kind,year,href,store,sort) values
('Orun Si (Ephphatha)','with Oladosu Twins','Live single','','https://onerpm.link/OrunSiBBO','All platforms',0),
('ORO','featuring Tope Alabi','Single','','https://onerpm.link/orobybbo','All platforms',1),
('Spontaneous Worship','','Album','2025','https://www.deezer.com/album/866312532','Deezer',2),
('Asise Eda','with Nana Aishat and Segun Ogungbe','EP','2025','https://music.apple.com/us/album/asise-eda-ep/1849102695','Apple Music',3),
('The Expression','','EP','2025','https://music.apple.com/us/album/the-expression-ep/1815359984','Apple Music',4),
('Iba (I Bow & Adore)','','Live album','2025','https://music.apple.com/us/album/iba-i-bow-adore-live/1788547969','Apple Music',5),
('Hymn Calvary','featuring Soji Adeleke','Single','2024','https://music.apple.com/us/album/hymn-calvary-feat-soji-adeleke-single/1781970455','Apple Music',6),
('Most High','','Live single','2024','https://music.apple.com/us/album/most-high-live-single/1777246145','Apple Music',7),
('LC8','','Live album','2024','https://music.apple.com/us/album/lc8/1775954177','Apple Music',8),
('Asotele Worship','','Live album','2024','https://music.apple.com/us/album/asotele-worship-live/1774830269','Apple Music',9),
('Olorun Mi Ga','','Single','2024','https://music.apple.com/us/album/olorun-mi-ga-single/1762135496','Apple Music',10),
('Worship on the Couch','featuring Ayo Alabi','Single','2024','https://music.apple.com/us/album/worship-on-the-couch-feat-ayo-alabi-single/1761650682','Apple Music',11),
('Arojinle','','Single','2024','https://music.apple.com/us/album/arojinle-single/1761645908','Apple Music',12);
insert into public.videos (youtube_id,title,credit,embed,sort) values
('brPR3pCSzXM','Orun Si (Ephphatha)','With Oladosu Twins, recorded live',true,0),
('t-SpU2bRuRY','ORO','Featuring Tope Alabi',true,1),
('JT0rkZd29ck','Most High','Official video',false,2),
('juDiB3odYIM','My God','Official video',false,3),
('4K4uEgE1vuk','Sound of Mercy','Featuring Woli Arole',true,4),
('4g5W9CODBGo','Iranlowo','Official video',true,5),
('zQ0miY3NVL4','I Believe in You','Official video',true,6),
('tuHZxWqRbcI','BBO Live in LAUTECH','Live ministration',true,7),
('xM75n_YRiN8','Ministering at Asotele','Live at The Light Nation Global',true,8),
('ksKCMmvOxwQ','Amin (Amen)','Live',true,9),
('vEXhBBcbl6s','Ka Ma Ma Ri','Tope Alabi featuring BBO and Eyitayo',true,10),
('UsuxI7OOwo0','DODOnDAWA','Testimony Jaga and BBO',true,11);
