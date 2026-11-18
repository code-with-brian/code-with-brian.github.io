/* All teaching copy. Numbers are CANDU 6 values from the sources listed at the bottom of the file. */
const TEXT = {
  plant: {
    group: 'Start here', num: 'Fig. 00', title: 'The whole plant',
    sub: 'One reactor, 728 megawatts, cut open so you can see inside.',
    opening: 'Unit at full power, all systems normal.',
    text: [
      'A CANDU is a heavy water reactor designed in Canada. The name stands for CANada Deuterium Uranium. Most reactors keep their fuel in one huge pressure vessel and must shut down to refuel. A CANDU spreads its fuel through 380 separate pressure tubes, runs on natural uranium, and refuels while it is making power.',
      'This drawing is the unit you will work on. Heat starts in the fuel, moves through heavy water to four steam generators, and leaves as ordinary steam for the turbine. Press <strong>Follow the heat</strong> to trace it, or click any part.',
      'The lessons build it up from one fuel pellet and end with three scenarios you run yourself.',
    ],
  },
  fuel: {
    group: 'The machine', num: 'Fig. 01', title: 'Fuel and heavy water',
    sub: 'Why this reactor can burn uranium straight from the ground.',
    opening: 'Fuel bench open. Natural uranium dioxide on the table.',
    text: [
      'Natural uranium is less than 1% U-235, the isotope that splits easily. Light water reactors need that share raised 4 to 7 times by enrichment. A CANDU skips enrichment altogether. Its trick is being careful with neutrons.',
      'Fission makes fast neutrons, and they must slow down before they can split the next atom. Heavy water slows them about 8 times less efficiently than light water, but it absorbs over 600 times fewer. So far more of them survive the trip. Run the neutron test in both waters and watch the difference.',
      'The fuel itself is simple: pellets of uranium dioxide sealed in Zircaloy tubes, 37 tubes to a bundle. A bundle is about the size of a fireplace log, 495 mm long and 102 mm across, and weighs 23.5 kg.',
      'Each bundle sits in a pressure tube full of hot coolant. A gas-filled gap keeps that heat away from the cool moderator outside. That gap also works as a leak detector, which matters later.',
    ],
    quiz: [
      { q: 'Why can a CANDU run on natural uranium?', o: ['Its fuel pellets are larger', 'Heavy water absorbs far fewer neutrons', 'It runs hotter than other reactors'], a: 1, why: 'Heavy water absorbs over 600 times fewer neutrons than light water, so natural uranium can sustain the chain reaction.' },
      { q: 'What keeps the hot coolant from heating the moderator?', o: ['A gas-filled annulus', 'A layer of lead', 'The fuel sheath'], a: 0, why: 'The gas annulus between the pressure tube and the calandria tube insulates them. It is also used to detect leaks.' },
      { q: 'How many fuel bundles sit in a CANDU 6 core?', o: ['380', '1,200', '4,560'], a: 2, why: '380 channels with 12 bundles each makes 4,560.' },
    ],
    task: 'Run the neutron test in light water three times, then in heavy water. Explain the difference to someone in one sentence without using the word "moderator".',
  },
  core: {
    group: 'The machine', num: 'Fig. 02', title: 'Refuelling at full power',
    sub: '380 channels, and a reactor that refuels while it runs.',
    opening: 'Looking at the reactor face. Fuelling machines parked.',
    text: [
      'The calandria is a horizontal tank of cool, low-pressure heavy water. 380 fuel channels run straight through it on a square grid. Each square in this drawing is one channel, seen end on.',
      'This is the biggest difference from most reactors. A pressurized water reactor loads extra fuel at the start of a cycle and stops every so often to reload. A CANDU keeps almost no spare reactivity. Instead, two fuelling machines lock onto opposite ends of a channel, one pushing new bundles in while the other collects used ones. All of it happens at full pressure and full power.',
      'A CANDU 6 refuels about 2 channels each full-power day, usually shifting 8 bundles per channel. That is about 16 bundles a day. So a CANDU never needs a refuelling outage, and its maintenance outages can be booked for whenever the grid can spare it.',
      'Your job here is to keep the core balanced. The liquid zones drain as fuel burns. Refuel the channels with the highest burnup and they stay in the green band.',
    ],
    quiz: [
      { q: 'Why does a CANDU not need refuelling outages?', o: ['The fuel lasts the life of the plant', 'Fuelling machines swap bundles at power', 'It refuels during maintenance only'], a: 1, why: 'Two machines work on opposite ends of a channel while the reactor runs at full power.' },
      { q: 'Which way does coolant flow in neighbouring channels?', o: ['Opposite directions', 'The same direction', 'It alternates every hour'], a: 0, why: 'Flow is bi-directional, opposite in adjacent channels. Toggle the flow overlay to see it.' },
      { q: 'What does on-power fuelling let the designers avoid?', o: ['Heavy water', 'Control systems', 'A large excess of reactivity in the core'], a: 2, why: 'Fresh fuel arrives daily, so very little spare reactivity needs to be held down in the core.' },
    ],
    task: 'Run 10 days and keep the zones in the green band with the fewest refuels you can. Then try refuelling low-burnup channels instead and see how quickly it stops working.',
  },
  heat: {
    group: 'The machine', num: 'Fig. 03', title: 'Moving the heat',
    sub: 'Two loops, four steam generators, and a figure of eight.',
    opening: 'Heat transport system at normal operating conditions.',
    text: [
      'Pumps push heavy water through the fuel channels at 8.6 tonnes a second. It enters at about 266 °C and leaves at 310 °C. At 9.9 MPa, nearly 100 times atmospheric pressure, it stays water instead of flashing to steam.',
      'There are two separate loops, each serving 190 channels. Each loop has two pumps, two steam generators and four headers. Coolant crosses the core in one direction, goes through a steam generator and pump, then crosses back the other way. Traced on paper the path is a figure of eight.',
      'Heavy water never leaves the reactor building. In the steam generators it boils ordinary water on the far side of the tubes, and that steam at 4.7 MPa and 268 °C drives the turbine. The result is 2,064 MW of heat and 728 MW of electricity, about 35% efficiency.',
      'The moderator is a separate system, kept cool at about 70 °C. It looks like a detail now. In Fig. 06 it becomes a lifeline.',
    ],
    quiz: [
      { q: 'Why is the primary coolant held near 10 MPa?', o: ['To push it through the turbine', 'So it stays water at about 310 °C', 'To keep neutrons inside the core'], a: 1, why: 'High pressure keeps the heavy water from flashing to steam at operating temperature.' },
      { q: 'How many channels does each heat transport loop serve?', o: ['95', '190', '380'], a: 1, why: 'Two loops share 380 channels, 190 each.' },
      { q: 'What is the rough thermal efficiency?', o: ['35%', '60%', '90%'], a: 0, why: '728 MWe from 2,064 MW of heat is 35%.' },
    ],
    task: 'Lower power to 60%. Which numbers change, and which stay almost the same? Why might an operator care that the steam side keeps its pressure?',
  },
  control: {
    group: 'Staying safe', num: 'Fig. 04', title: 'Control and shutdown',
    sub: 'Everything that goes into the moderator, and why nothing goes into the coolant.',
    opening: 'Regulating system in control. Both shutdown systems poised.',
    text: [
      'Reactor control is bookkeeping in units of milli-k (mk). Fuel adds reactivity. Xenon and absorbers take it away. Exact balance means steady power. The panel under the drawing is that ledger.',
      'The regulating system does the fine work with <strong>14 liquid zone compartments</strong>, filling or draining light water to soak up neutrons in each part of the core. <strong>21 adjuster rods</strong> normally sit in the core to flatten the power shape. <strong>4 mechanical control absorbers</strong> drive in for quick reductions.',
      'Safety is separate. <strong>Shutdown System 1</strong> drops 28 cadmium rods by gravity. <strong>Shutdown System 2</strong> shoots gadolinium nitrate solution into the moderator through 6 nozzles. They are physically and functionally separate from each other and from the regulating system, and either one alone can shut the reactor down. Take SDS1 out of service below and see.',
      'Here is the part critics rightly ask about. A CANDU has a positive void coefficient. If coolant is lost from the channels, the moderator stays in place and reactivity goes up, so a large break is the hardest test for the shutdown systems. The design answers with a long neutron lifetime that slows the rise, plus two fast independent shutdown systems. Press <strong>Break a coolant pipe</strong> to see the sequence.',
    ],
    quiz: [
      { q: 'What handles minute-to-minute power control?', o: ['Liquid zone controllers', 'The shutoff rods', 'Gadolinium nitrate'], a: 0, why: 'Zones fill or drain light water in 14 compartments. The shutdown systems are kept separate from control.' },
      { q: 'Where are all control and shutdown devices located?', o: ['In the high-pressure coolant', 'In the low-pressure moderator', 'In the steam generators'], a: 1, why: 'They sit in the low-pressure moderator, so they do not face large hydraulic forces.' },
      { q: 'Why is reactivity positive when coolant is lost in a CANDU?', o: ['The fuel melts first', 'The moderator stays in place while coolant voids', 'Pumps add energy'], a: 1, why: 'Coolant and moderator are separate. Losing coolant leaves the moderator working, and less scattering in the bundle raises reactivity.' },
    ],
    task: 'Take SDS1 out of service, then break a coolant pipe. What does the log show? Why is a reactor still not allowed to run with one shutdown system unavailable?',
  },
  trip: {
    group: 'When it stops', num: 'Fig. 05', title: 'The xenon clock',
    sub: 'Trip the reactor, then restart it before xenon locks you out.',
    opening: 'Unit at full power. Press the button when you are ready.',
    text: [
      'While a reactor runs, fission makes iodine-135, which decays into xenon-135. Xenon soaks up neutrons better than almost anything, but the neutron flux burns it away as fast as it forms. It stays in balance.',
      'Trip the reactor and the balance breaks. The neutrons stop, so the burn-off stops, but the iodine already in the fuel keeps turning into xenon. The poison builds up and the core drifts further from being able to restart.',
      'A CANDU has little spare reactivity, because it refuels daily. Pulling the adjuster rods gives about 15 mk, which buys about 30 minutes. Miss that window and you are <strong>poisoned out</strong>: xenon peaks about 10 hours later and the reactor cannot restart for about a day and a half, however good your operators are.',
      'Which leads to the real lesson. Poison-out costs money. It is not a safety problem. If the cause of the trip is real, the correct move is to stay shut down and let the clock run out.',
    ],
    quiz: [
      { q: 'Why does xenon rise after a trip?', o: ['Rods release it', 'Iodine keeps decaying, and neutrons no longer burn xenon off', 'The moderator heats up'], a: 1, why: 'Production carries on from iodine, but the main removal path disappears with the flux.' },
      { q: 'About how long after a trip does xenon peak?', o: ['30 minutes', '10 hours', '10 days'], a: 1, why: 'It peaks about 10 hours later at several times its full-power level.' },
      { q: 'You have 8 minutes left and the annunciator shows annulus moisture. What now?', o: ['Restart quickly to save the unit', 'Hold shutdown and find the leak', 'Withdraw adjusters and wait'], a: 1, why: 'Poison-out is a cost. Restarting on an unexplained safety signal is the actual mistake.' },
    ],
    task: 'Run the drill three times, since the cause changes each run. Your best result is a good one to share.',
  },
  blackout: {
    group: 'When it stops', num: 'Fig. 06', title: 'Losing the grid',
    sub: 'Take away one heat sink at a time and watch what picks up the load.',
    opening: 'Grid connected. Class IV power normal.',
    text: [
      'Shutting a reactor down stops fission, but fuel keeps making heat as its fission products decay. Typically that is 6 to 7% of full power right after shutdown and 1 to 2% an hour later. On a 2,064 MW core, that means well over 100 MW falling to roughly 20 to 40 MW. It has to go somewhere, which is why cooling matters even after a perfect shutdown.',
      'CANDU stations rank their electrical supplies by how interruptible they are. <strong>Class IV</strong> is normal AC. Lose it and the pumps stop. <strong>Class III</strong> comes back on standby generators. <strong>Class II and I</strong> run from batteries, good for at least 40 minutes, so control and protection never go dark.',
      'With the pumps off, physics takes over. Hot water rises to the steam generators, cools and sinks, a natural circulation called <strong>thermosyphoning</strong>. It cannot carry full power, but it can carry decay heat.',
      'Then come the layers. Emergency water and power supply the steam generators. If those fail, the moderator can take the heat even with no water in the fuel channels. If that fails, the shield tank holds the debris inside the calandria for at least 24 hours. Since Fukushima, operators also keep portable generators and fuel on hand.',
    ],
    quiz: [
      { q: 'What moves decay heat when the main pumps stop?', o: ['Thermosyphoning', 'The turbine', 'The fuelling machines'], a: 0, why: 'Natural circulation carries decay heat from the channels to the steam generators.' },
      { q: 'What do the station batteries guarantee?', o: ['Full pump power for a day', 'At least 40 minutes of Class I and II loads', 'Enough to restart the reactor'], a: 1, why: 'They ride through until generators start or other supplies arrive.' },
      { q: 'Why does a shut-down reactor still need cooling?', o: ['Rods give off heat', 'Fission products keep releasing decay heat', 'The moderator reacts with the fuel'], a: 1, why: 'Decay heat falls quickly but never instantly to zero.' },
    ],
    task: 'Work down the ladder and note what time each layer buys. Which one depends on nobody doing anything at all?',
  },
  outage: {
    group: 'When it stops', num: 'Fig. 07', title: 'A planned outage',
    sub: 'What happens when you choose to stop, and how long the big jobs take.',
    opening: 'Outage planning complete. Grid operator notified.',
    text: [
      'With no refuelling outages to plan around, a CANDU 6 stops for maintenance and inspection about every 2 years. The timing can be picked to suit the grid. Step through one below. The day numbers are illustrative, since real schedules depend on the scope.',
      'First comes the guaranteed shutdown state. Poison goes into the moderator, or at some stations the moderator is drained, so the reactor stays subcritical no matter what else happens. Then the unit cools and the primary system is drained to header level, about 0.5 MPa and 54 °C. Most maintenance happens in this state, with the channels still cooled.',
      'That is why outages have their own risk. Decay heat is low, but the plant is opened up and shutdown cooling is carrying the load. Protecting that cooling drives the schedule.',
      'Outages also come in very different sizes. A vacuum building outage at a multi-unit Ontario station takes all units offline for about 20 days every 12 years. Single-unit CANDU 6 plants use a dousing tank in the reactor building instead. Refurbishment is the giant: every fuel channel replaced. Darlington Unit 4 took 968 days, and the four-unit project wrapped up in March 2026 after starting in 2016.',
    ],
    quiz: [
      { q: 'What does the guaranteed shutdown state guarantee?', o: ['The turbine is locked', 'The reactor stays subcritical whatever changes', 'All fuel has been removed'], a: 1, why: 'It holds the reactor in a stable subcritical state even with process failures.' },
      { q: 'Why do crews drain to header level?', o: ['It is the state most maintenance is done in', 'To refuel the reactor', 'To test the turbine'], a: 0, why: 'It opens the system for work while the fuel stays cooled.' },
      { q: 'Which outage is the longest?', o: ['Poison-out', 'Vacuum building outage', 'Refurbishment'], a: 2, why: 'Refurbishment takes years. Darlington Unit 4 took 968 days.' },
    ],
    task: 'Pretend you run the outage. If shutdown cooling trips on day 5, which of your work tiles would you stop first, and why?',
  },
};

const PARTS = {
  'calandria': { name: 'Calandria', text: 'A horizontal tank of cool, low-pressure heavy water moderator. Fuel channels run straight through it.', fact: 'CANDU 6: 380 channels on a 286 mm square lattice.' },
  'fuel-channel': { name: 'Fuel channel', text: 'A pressure tube holding 12 fuel bundles in flowing coolant, inside a calandria tube with an insulating gas gap between them.', fact: 'Every channel is a small pressure boundary of its own, and each is highly subcritical alone.' },
  'end-shield': { name: 'End shield', text: 'Closes each end of the calandria, supports the fuel channels and shields the fuelling machine vaults.' },
  'shield-tank': { name: 'Shield tank', text: 'Water around the calandria that shields the concrete vault. In a severe accident it can keep the outside of the calandria shell cool.', fact: 'Designed to retain debris for at least 24 hours.' },
  'feeders': { name: 'Feeders', text: 'Hundreds of small pipes that connect each end of every fuel channel to the headers. Blue feeders carry coolant in, red carry it out.', fact: 'Drawn here as one feeder per channel on this end.' },
  'roh': { name: 'Reactor outlet header', text: 'Collects hot coolant from the feeders and sends it to a steam generator.', fact: '9.9 MPa(g), 310 °C.' },
  'rih': { name: 'Reactor inlet header', text: 'Shares cooled coolant from the pumps out to the feeders.', fact: 'About 266 °C.' },
  'hot-leg': { name: 'Hot leg', text: 'Carries 310 °C heavy water from the outlet header up to the steam generator.' },
  'cold-leg': { name: 'Cold leg', text: 'Carries cooled heavy water back through the pump to the inlet header.' },
  'steam-generator': { name: 'Steam generator', text: 'Heavy water flows through vertical U-tubes and boils ordinary water around them. The two waters never mix.', fact: 'Four units. Steam at 4.7 MPa, 268 °C, 99.75% quality or better.' },
  'pump': { name: 'Heat transport pump', text: 'Four vertical centrifugal pumps drive the coolant. They run on Class IV power, so a grid loss stops them.', fact: 'Total coolant flow 8.6 Mg/s.' },
  'pressurizer': { name: 'Pressurizer', text: 'Holds system pressure steady as the coolant expands and contracts with power changes.' },
  'deck': { name: 'Reactivity mechanisms deck', text: 'The platform above the calandria where rod drives sit. Everything goes down into the low-pressure moderator, never the coolant.' },
  'sds1': { name: 'Shutdown System 1', text: 'Black ticks: 28 cadmium shutoff rods held above the core, released to fall on a trip signal.', fact: 'Physically separate from SDS2 and from the regulating system.' },
  'sds2': { name: 'Shutdown System 2', text: 'Tanks of gadolinium nitrate solution, driven into the moderator through 6 nozzles when triggered.', fact: 'Solution held at about 8,000 ppm.' },
  'adjusters': { name: 'Adjuster rods', text: 'Blue ticks: 21 rods that normally sit in the core flattening power. Withdrawn, they give about 15 mk to fight xenon.' },
  'mca': { name: 'Mechanical control absorbers', text: 'Red ticks: 4 absorber rods that normally sit above the core and drive in for quick power reductions.' },
  'moderator-hx': { name: 'Moderator cooling', text: 'Pumps and heat exchangers remove the heat that gamma rays and neutrons deposit in the moderator.', fact: 'Moderator runs at about 70 °C.' },
  'dousing': { name: 'Dousing tank', text: 'Ordinary water stored high in the reactor building. If steam raises the pressure, it sprays down to condense it.', fact: 'CANDU 6 feature. Multi-unit Ontario stations use a vacuum building.' },
  'containment': { name: 'Reactor building', text: 'The containment boundary, shown cut open. It is the last physical barrier around the plant.' },
  'steam-line': { name: 'Main steam', text: 'Ordinary steam from the steam generators to the turbine. This water never touches the reactor core.' },
  'feedwater': { name: 'Feedwater', text: 'Condensed water pumped back to the steam generators. If it is lost, auxiliary and emergency supplies take over.' },
  'turbine': { name: 'Turbine', text: 'High-pressure and low-pressure cylinders on one shaft, turned by steam from the steam generators.' },
  'condenser': { name: 'Condenser', text: 'Turns spent steam back into water so that it can be pumped round again.' },
  'generator': { name: 'Generator', text: 'Makes the electricity.', fact: '728 MWe gross.' },
  'switchyard': { name: 'Switchyard', text: 'Connects the unit to the grid. In normal running, Class IV station power also comes through here or from the unit itself.' },
  'fuel-bay': { name: 'Spent fuel bay', text: 'Used bundles go underwater here to cool. The blue glow is Cherenkov light, made by fast charged particles moving through water.' },
  'diesels': { name: 'Standby generators', text: 'Start automatically when Class IV power is lost and feed the Class III loads.' },
  'batteries': { name: 'Station batteries', text: 'Keep Class I and II control and protection loads alive with no gap.', fact: 'At least 40 minutes with no AC at all.' },
  'ecc': { name: 'Emergency core cooling', text: 'If coolant is lost through a break, this system refills the channels to keep fuel cool.' },
  'fuelling-machine': { name: 'Fuelling machine', text: 'One machine at each end. They seal onto a channel at full pressure, then push new bundles in and take used ones out.', fact: 'Bundles stay immersed in heavy water while they are handled.' },
  'pellet': { name: 'Fuel pellet', text: 'Compacted, sintered natural uranium dioxide.', fact: 'Less than 1% U-235.' },
  'element': { name: 'Fuel element', text: 'A Zircaloy tube sealed around a stack of pellets. The sheath is the first barrier against fission products.' },
  'bundle': { name: 'Fuel bundle', text: '37 elements held together by end plates.', fact: '495 mm long, 102.4 mm across, 23.5 kg with 2.1 kg of it zirconium alloy.' },
  'coolant': { name: 'Coolant', text: 'Pressurized heavy water flowing through the bundle.', fact: '9.9 MPa and up to 310 °C.' },
  'pressure-tube': { name: 'Pressure tube', text: 'Holds the high-pressure coolant and the fuel. This replaces the giant pressure vessel of other reactor types.' },
  'annulus': { name: 'Gas annulus', text: 'A gas-filled gap that insulates the hot pressure tube from the cool moderator. Moisture in this gas is an early sign of a leak.', fact: 'Moved spacers let a tube sag across this gap in the 1983 Pickering failure.' },
  'calandria-tube': { name: 'Calandria tube', text: 'A Zircaloy tube that separates the channel from the moderator around it.' },
  'moderator': { name: 'Moderator', text: 'Cool heavy water that slows neutrons between the fuel channels.', fact: 'About 70 °C, at low pressure.' },
};

const SOURCES = [
  ['Zhang and Shalaby, Introduction to the Qinshan Phase III CANDU Nuclear Power Plant (AECL/TQNPC). Core, fuel, flow, steam and safety design figures.', 'https://www.nuceng.ca/canteach-rev2/library/20054402.pdf'],
  ['Rouben, CANDU Fuel Management Course (AECL). Lattice and refuelling rate.', 'https://www.nuceng.ca/canteach-rev2/library/20031111.pdf'],
  ['CNSC, The Use of Rod-Based Guaranteed Shutdown State in CANDU Reactors. Guaranteed shutdown state.', 'https://cnsc-ccsn.gc.ca/eng/resources/research/technical-papers-and-articles/2016/use-of-rod-based-guaranteed-shutdown-state-in-candu-reactors'],
  ['CNSC, Emergency Power Systems at Canadian Nuclear Power Plants. Power classes and post-Fukushima equipment.', 'https://www.cnsc-ccsn.gc.ca/eng/resources/research/technical-papers-and-articles/2015/2015-emergency-power-systems-at-canadian-npp'],
  ['Emergency Mitigating Equipments: Post Fukushima Actions at Canadian Nuclear Power Plants, Portable AC Power Sources (in NEA/CSNI/R(2015)4/ADD1). Battery supply to Class I and II loads for a minimum of 40 minutes.', 'https://www.scribd.com/document/412910482/46066634-pdf'],
  ['Beremoi, CANDU Overview, Chapter 3: Reactor Control. Adjusters and xenon override.', 'https://ww.nuceng.ca/canteach-rev2/library/20044204.pdf'],
  ['IAEA CANDU I&C course, Lesson 7. Override time and its four phases.', 'https://ww.nuceng.ca/canteach-rev2/library/20041607.pdf'],
  ['CANTEACH, Reactivity Control Devices. Shutoff rods, adjusters, restart after poison-out.', 'https://ww.nuceng.ca/canteach-rev2/library/20041213.pdf'],
  ['Nuclear FAQ, Section A. Heavy water properties, shutoff rod and adjuster counts.', 'https://nuclearfaq.ca/cnf_sectionA.htm'],
  ['Bruce Power, Bruce B Vacuum Building Outage. Length and frequency of a vacuum building outage.', 'https://brucepower.com/?p=24915'],
  ['World Nuclear News, Darlington 4 back in service, completing refurb project.', 'https://www.world-nuclear-news.org/articles/darlington-4-at-100-power-completing-refurb-project'],
  ['Overview of Pickering NGS Units 1 and 2 Retube Outage (CNS). The 1983 pressure tube failure and retubing.', 'https://proceedings.cns-snc.ca/index.php/pcns/article/view/958'],
];

const SOURCES_HTML = `<h2>Sources and simplifications</h2>
<details><summary>Where the numbers come from</summary><ul>${SOURCES.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`).join('')}</ul></details>
<details><summary>What this model leaves out</summary><ul>
<li>Plant values are for a CANDU 6 class unit. Darlington, Bruce and Pickering differ in size, layout and containment.</li>
<li>The drawing is a schematic. Parts are moved apart and rescaled so you can see them, and only the fuel channel and feeder counts are literal.</li>
<li>The xenon model is a point model tuned to published figures: about 30 minutes of override from 15 mk (sources give 30 to 40), a peak near 10 hours, and restart after about 36 hours. Real timing depends on power history and plant condition.</li>
<li>Decay heat uses a standard textbook fit, not a CANDU-specific calculation. It sits at the low end of the published range, about 1% of full power an hour after shutdown where general references give 1.5 to 2%.</li>
<li>Part-power temperatures in Fig. 03 are illustrative. Refuelling and liquid zone behaviour in Fig. 02 use teaching values.</li>
<li>Drill steps, durations and alarm wording are simplified teaching inventions. Outage day numbers are illustrative.</li>
</ul></details>`;

const FOOT_HTML = 'Independent educational material. Not an operator training or qualification tool, not a plant simulator, and not affiliated with or endorsed by any reactor designer, utility or regulator. CANDU® is a registered trademark of Atomic Energy of Canada Limited.';

/* The guided path through each lesson. `press` names a button on the page, so the tour drives the real controls. */
const GUIDE = {
  plant: {
    steps: [
      { t: 'Make the heat', press: 'Follow the heat' },
      { t: 'Carry it away', press: 'Next step' },
      { t: 'Boil ordinary water', press: 'Next step' },
      { t: 'Send out the steam', press: 'Next step' },
      { t: 'Make electricity', press: 'Next step' },
      { t: 'Turn the steam back to water', press: 'Next step' },
      { t: 'Go round again', press: 'Next step' },
    ],
    end: 'Back to the start',
    key: 'Heat moves from the fuel to heavy water, then to ordinary water, then to steam. The two waters never touch.',
  },
  fuel: {
    steps: [
      { t: 'Start with a pellet', press: 'Stack the pellets' },
      { t: 'Seal the pellets in a tube', press: 'Seal an element' },
      { t: 'Group 37 tubes into a bundle', press: 'Build a bundle' },
      { t: 'Load 12 bundles into a channel', press: 'Load a channel' },
      { t: 'Slice through the channel', press: 'Cut a cross-section' },
      { t: 'Send neutrons through light water', press: 'Neutron test: light water' },
      { t: 'Now try heavy water', press: 'Neutron test: heavy water' },
    ],
    key: 'Heavy water wastes so few neutrons that natural uranium can keep the chain reaction going.',
  },
  core: {
    steps: [
      { t: 'Find the channel most in need of fuel', press: 'Pick the highest burnup' },
      { t: 'Refuel it while the reactor runs', press: 'Refuel selected channel' },
      { t: 'Let a day pass', press: 'Run one day' },
      { t: 'See which way the coolant flows', press: 'Show flow direction', then: 'Show burnup map' },
      { t: 'Split the core into its two loops', press: 'Show the two loops' },
    ],
    key: 'Refuelling a little every day means a CANDU never needs a refuelling outage.',
  },
  heat: {
    steps: [
      { t: 'Out of the core', press: 'Trace one loop' },
      { t: 'Into a steam generator', press: 'Next step' },
      { t: 'Down to a pump', press: 'Next step' },
      { t: 'Back across the core', press: 'Next step' },
      { t: 'The moderator stays apart', press: 'Next step' },
      { t: 'Your turn: drag the Reactor power slider', press: 'Clear the trace', point: '.power', say: 'Watch the fuel glow and the numbers at the top as power changes.' },
    ],
    key: 'Two figure-of-eight loops carry the heat, while the moderator stays cool on its own circuit.',
  },
  control: {
    steps: [
      { t: 'Burning fuel lowers reactivity', press: 'Burn a day of fuel' },
      { t: 'Fresh fuel puts it back', press: 'Refuel two channels' },
      { t: 'Cut power quickly', press: 'Set back to 60%', then: 'Return to full power' },
      { t: 'Shut down with the first system', first: 'Return to full power', press: 'Trip with SDS1' },
      { t: 'Shut down with the second system', first: 'Reset the plant', press: 'Trip with SDS2' },
      { t: 'Break a coolant pipe', first: 'Reset the plant', press: 'Break a coolant pipe' },
    ],
    key: 'Small devices trim power every day. For emergencies, two separate systems can each stop the reactor.',
  },
  trip: { goal: 'Find out what tripped the unit, then restart before the clock runs out.' },
  blackout: { goal: 'Take away one layer of cooling at a time and see what catches the heat next.' },
  outage: { goal: 'Step through a planned outage. The drawing follows each phase.' },
};


/* Plain-language definitions. The first use of each term on a page becomes tappable. */
const GLOSSARY = [
  ['calandria', 'The large horizontal tank that holds the cool heavy water moderator. The fuel channels run through it.'],
  ['moderator', 'Heavy water that slows neutrons so they can split more uranium. In a CANDU it stays cool and separate from the coolant.'],
  ['pressure tubes?', 'The tube that holds the fuel bundles and the hot coolant under pressure.'],
  ['annulus', 'The gas-filled gap between the pressure tube and the calandria tube.'],
  ['burnup', 'How much energy a fuel bundle has already given up. High burnup means it is due for replacing.'],
  ['reactivity', 'How far the chain reaction is from steady. Positive means power rises, and negative means it falls.'],
  ['mk', 'Milli-k, the unit of reactivity. One mk changes the neutron population by 0.1% each generation.'],
  ['%FP', 'Percent of full power.'],
  ['xenon(?:-135)?', 'Xenon-135, a fission product that absorbs neutrons strongly. It acts as a poison on the chain reaction.'],
  ['trip(?:ped|s)?', 'A fast, automatic shutdown of the reactor.'],
  ['critical', 'The steady state where each fission causes exactly one more. It does not mean danger.'],
  ['decay heat', 'The heat fission products keep giving off after the reactor stops.'],
  ['adjusters?', 'Rods that normally sit in the core. Pulling them out adds reactivity.'],
  ['SDS1', 'Shutdown System 1: 28 rods that drop into the moderator.'],
  ['SDS2', 'Shutdown System 2: it injects a gadolinium solution into the moderator.'],
  ['liquid zones?', 'Compartments of light water used for fine power control. More water absorbs more neutrons.'],
  ['headers?', 'A large pipe that collects coolant from many channels, or feeds it to them.'],
  ['feeders?', 'The small pipes linking each fuel channel to the headers.'],
  ['thermosyphon(?:ing)?', 'Natural circulation. Hot water rises and cool water sinks, so coolant moves without pumps.'],
  ['heat sink', 'Anywhere the reactor\'s heat can be sent.'],
  ['poison-out', 'When xenon has built up too far to restart. The unit has to wait for it to decay.'],
  ['Zircaloy', 'A zirconium alloy that absorbs very few neutrons.'],
];
