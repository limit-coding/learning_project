import generatedCourseGuides from './generatedCourseGuides.json';
import generatedCourseCatalog from './generatedCourseCatalog.json';

export interface ChapterFocus {
  title: string;
  focus: string;
  checklist: string[];
}

export interface MindMapBranch {
  title: string;
  children: string[];
}

export interface ResourceRecommendation {
  title: string;
  type: string;
  description: string;
  url?: string;
}

export interface StudySummarySection {
  title: string;
  points: string[];
}

export interface CourseGuide {
  code: string;
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  route: string[];
  chapters: ChapterFocus[];
  mindMap: MindMapBranch[];
  studySummary: StudySummarySection[];
  outcomes: string[];
  resources: ResourceRecommendation[];
  publicMaterials: ResourceRecommendation[];
}

const manualCourseGuides: CourseGuide[] = [
  {
    code: 'BUPT_DM',
    slug: 'bupt_discrete_math',
    title: '离散数学',
    shortTitle: '离散',
    summary: '先把逻辑语言和集合关系学扎实，再用图论、组合计数和递推把抽象证明题变成可操作题型。',
    route: ['命题逻辑与谓词逻辑', '集合、关系、函数', '图论与树', '组合计数与递推', '综合证明题'],
    chapters: [
      {
        title: '第 1 章：命题逻辑',
        focus: '命题、联结词、真值表、等值演算、蕴含和推理规则。',
        checklist: ['能把自然语言翻译成命题公式', '能用等值式化简', '能判断推理是否有效'],
      },
      {
        title: '第 2 章：谓词逻辑与集合',
        focus: '量词、谓词、集合运算、笛卡尔积，为后续关系和函数打底。',
        checklist: ['区分全称/存在量词作用域', '掌握德摩根律', '能写出集合证明过程'],
      },
      {
        title: '第 3-4 章：关系、图与树',
        focus: '等价关系、偏序关系、图的连通性、欧拉图、哈密顿图、树的性质。',
        checklist: ['会判断关系性质', '会用握手定理', '会做生成树与最短路径基础题'],
      },
      {
        title: '第 5 章：组合与递推',
        focus: '排列组合、鸽巢原理、容斥原理、递推关系和母函数入门。',
        checklist: ['能识别计数模型', '会写递推式', '能用容斥处理重复计数'],
      },
    ],
    mindMap: [
      { title: '逻辑', children: ['真值表', '等值演算', '推理规则', '量词'] },
      { title: '结构', children: ['集合', '关系', '函数', '偏序'] },
      { title: '图论', children: ['连通性', '路径回路', '树', '平面图'] },
      { title: '计数', children: ['排列组合', '容斥', '递推', '鸽巢'] },
    ],
    studySummary: [
      { title: '核心概念', points: ['命题与谓词逻辑', '集合、关系、函数', '图、树与连通性'] },
      { title: '题型抓手', points: ['等值演算', '关系性质判断', '图论证明', '组合计数'] },
      { title: '易混点', points: ['必要/充分条件', '等价关系/偏序关系', '欧拉图/哈密顿图'] },
    ],
    outcomes: ['整理一页逻辑等值式表', '完成 20 道图论与组合典型题', '能独立写出证明题的关键步骤'],
    resources: [
      { title: '逻辑公式速查卡', type: '知识卡', description: '把常用等值式、推理规则、量词变换放在同一张表里。' },
      { title: '图论题型清单', type: '习题', description: '按连通、树、欧拉/哈密顿、平面图分类刷题。' },
    ],
    publicMaterials: [
      {
        title: 'MIT 6.042J Mathematics for Computer Science',
        type: '公开课',
        description: '离散数学面向计算机方向的经典公开课，适合补证明、集合关系、图论、计数和离散概率。',
        url: 'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/',
      },
      {
        title: 'Kenneth H. Rosen《Discrete Mathematics and Its Applications》',
        type: '教材',
        description: '覆盖面很全，适合作为定义和例题参考书；刷题时重点看逻辑、关系、图论、组合部分。',
      },
      {
        title: 'Concrete Mathematics',
        type: '参考书',
        description: '更偏竞赛和算法思维，适合学有余力时看求和、递推和组合恒等式。',
      },
    ],
  },
  {
    code: 'BUPT_PRACTICE',
    slug: 'bupt_programming_practice',
    title: '程序设计基础实训',
    shortTitle: '实训',
    summary: '核心不是多写代码，而是把需求、模块、测试、文档和答辩串成一个稳定交付流程。',
    route: ['需求拆解', '模块设计', '核心编码', '调试测试', '文档与答辩'],
    chapters: [
      {
        title: '阶段 1：需求与数据结构',
        focus: '明确输入输出、状态数据、边界条件和评分点，先画模块草图。',
        checklist: ['写出功能清单', '确定核心结构体/类', '列出异常输入'],
      },
      {
        title: '阶段 2：C/C++ 工程实现',
        focus: '拆分头文件和源文件，保持 main 函数轻量，优先完成最小可运行闭环。',
        checklist: ['完成模块接口', '能编译运行', '提交记录清晰'],
      },
      {
        title: '阶段 3：调试与测试',
        focus: '用断点、日志、最小复现定位问题，补齐文件读写和边界样例。',
        checklist: ['覆盖正常/异常样例', '检查内存和越界', '整理测试截图'],
      },
      {
        title: '阶段 4：README 与答辩',
        focus: '说明设计思路、运行方式、亮点和不足，准备 3 分钟演示路径。',
        checklist: ['README 可复现', '演示脚本稳定', '答辩问题有预案'],
      },
    ],
    mindMap: [
      { title: '需求', children: ['功能列表', '输入输出', '评分点', '边界'] },
      { title: '工程', children: ['模块接口', '文件组织', 'Git', 'README'] },
      { title: '质量', children: ['断点调试', '测试样例', '异常处理', '复现'] },
      { title: '展示', children: ['演示流程', '亮点', '不足', '答辩'] },
    ],
    studySummary: [
      { title: '核心任务', points: ['需求拆解', '模块接口', '最小可运行闭环', 'README 与演示'] },
      { title: '工程抓手', points: ['文件组织', 'Git 提交', '断点调试', '测试样例'] },
      { title: '交付风险', points: ['边界输入遗漏', '文件路径问题', '演示流程不稳定', '答辩解释不清'] },
    ],
    outcomes: ['一份可运行项目', '一组测试用例', '一份 README 和答辩提纲'],
    resources: [
      { title: '项目交付检查表', type: '清单', description: '提交前逐项检查功能、测试、文档和演示。' },
      { title: 'C/C++ 调试速记', type: '笔记', description: '集中整理断点、日志、文件处理和常见编译问题。' },
    ],
    publicMaterials: [
      {
        title: 'LearnCpp.com',
        type: '在线教程',
        description: '现代 C++ 免费教程，适合查语法、类、引用、指针、文件、调试和工程化细节。',
        url: 'https://www.learncpp.com/',
      },
      {
        title: 'MIT The Missing Semester',
        type: '公开课',
        description: '补命令行、Git、调试、编辑器和脚本工具，适合实训项目交付前集中看。',
        url: 'https://missing.csail.mit.edu/',
      },
      {
        title: 'Pro Git Book',
        type: '工具书',
        description: 'Git 官方书籍，适合整理提交记录、分支协作、回滚和项目 README。',
        url: 'https://git-scm.com/book/en/v2',
      },
    ],
  },
  {
    code: 'BUPT_COA',
    slug: 'bupt_computer_organization',
    title: '计算机原理与组成（微机原理）',
    shortTitle: '计组/微机',
    summary: '先用微型计算机系统概述搭起底层框架，再进入 ARM/Cortex-M4 处理器、寄存器、存储器映射 I/O、异常中断和位带操作。',
    route: ['微机系统概述', '数制与机器码', 'ARM 处理器架构', 'Cortex-M4 编程模型', '异常中断与 I/O'],
    chapters: [
      {
        title: '第 1 章：微型计算机系统概述',
        focus: '建立微机系统的底层框架：微处理器发展、冯·诺依曼结构、系统硬件组成、指令执行流程、流水线、数制与机器码编码。',
        checklist: [
          '能复述冯·诺依曼结构五大部件与存储程序思想',
          '能说明取指、译码、执行、回写的指令执行流程',
          '能完成二/十/十六进制转换和原码/反码/补码计算',
          '能区分进位与溢出，并判断带符号运算是否有效',
          '能比较冯·诺依曼结构、哈佛结构、CISC 与 RISC',
        ],
      },
      {
        title: '第 2 章：ARM 处理器',
        focus: '围绕 ARM/RISC 架构理解 Cortex-M4 的工作状态、模式、寄存器组织、存储组织、异常中断、复位、位带操作和 Thumb 指令集。',
        checklist: [
          '能准确对比 CISC 与 RISC 的指令集、执行周期和寄存器使用特点',
          '能区分 ARM/Thumb 工作状态与线程/处理工作模式',
          '能说明 Cortex-M4 通用寄存器和特殊功能寄存器的作用',
          '能解释存储器映射 I/O、数据对齐、大端/小端存储格式',
          '能说明异常、中断、NVIC、复位流程和位带操作的基本用途',
        ],
      },
    ],
    mindMap: [
      { title: '微机系统概述', children: ['微处理器发展', '摩尔定律', '嵌入式系统', 'SoC'] },
      { title: '体系结构', children: ['冯·诺依曼结构', '哈佛结构', 'CISC', 'RISC'] },
      { title: '硬件组成', children: ['CPU', '运算器', '控制器', '内存储器', '系统总线'] },
      { title: '指令执行', children: ['取指', '译码', '执行', '结果回写', '流水线'] },
      { title: '数制与编码', children: ['二进制转换', '十六进制转换', '原码', '反码', '补码', 'BCD码', 'ASCII码'] },
      { title: 'ARM 架构', children: ['ARM状态', 'Thumb状态', 'Thumb-2', 'LOAD/STORE', '桶式移位器'] },
      { title: 'Cortex-M4', children: ['寄存器组织', '工作模式', '数据对齐', '存储组织', '复位流程'] },
      { title: '外设与异常', children: ['存储器映射 I/O', 'NVIC', '异常', '中断', '位带操作'] },
    ],
    studySummary: [
      {
        title: '概念主线',
        points: ['微机系统组成', '冯·诺依曼结构', '指令执行流程', 'ARM/Cortex-M4 编程模型'],
      },
      {
        title: '计算抓手',
        points: ['二/十/十六进制转换', '原码/反码/补码', '补码加减', '进位与溢出判断'],
      },
      {
        title: '硬件抓手',
        points: ['CPU 与系统总线', '寄存器组织', '存储器映射 I/O', '异常、中断与 NVIC'],
      },
      {
        title: '易混点',
        points: ['工作状态 vs 工作模式', '进位 vs 溢出', '冯·诺依曼 vs 哈佛结构', '异常 vs 中断'],
      },
      {
        title: '后续衔接',
        points: ['ARM 指令编程', 'I/O 端口控制', '位带操作', '嵌入式系统实验'],
      },
    ],
    outcomes: [
      '能用一张图解释微型计算机系统的基本组成和指令执行流程',
      '能完成数制转换、补码加减和溢出判断等基础计算',
      '能说明 ARM/Cortex-M4 的状态、模式、寄存器、I/O 和异常中断机制',
    ],
    resources: [
      { title: '第 1 章微机系统概述知识卡', type: '知识卡', description: '整理冯·诺依曼结构、系统硬件组成、指令执行流程、流水线、数制与机器码。' },
      { title: '第 1 章数制与补码题型表', type: '习题', description: '覆盖数制转换、原码/反码/补码、补码加减、进位与溢出判断。' },
      { title: '第 2 章 ARM 处理器知识图谱', type: '思维导图', description: '围绕 CISC/RISC、ARM/Thumb、Cortex-M4、存储器映射 I/O、异常中断与位带操作组织。' },
      { title: 'Cortex-M4 易混概念清单', type: '清单', description: '集中区分工作状态/工作模式、异常/中断、统一编址/独立编址、数据对齐和位带区域限制。' },
    ],
    publicMaterials: [
      {
        title: 'UC Berkeley CS61C: Great Ideas of Computer Architecture',
        type: '公开课',
        description: '机器结构与计算机体系结构公开课，可作为 CISC/RISC、指令执行、流水线和存储体系的补充参考。',
        url: 'https://www2.eecs.berkeley.edu/Courses/CS61C/',
      },
      {
        title: 'CMU 15-213 Introduction to Computer Systems',
        type: '公开课',
        description: '从程序员视角理解机器级代码、存储和系统运行机制，适合作为后续系统方向补充。',
        url: 'https://www.cs.cmu.edu/~213/',
      },
      {
        title: '《Computer Systems: A Programmer’s Perspective》',
        type: '教材',
        description: '适合作为机器级程序、存储层次和系统编程的长期参考书。',
      },
      {
        title: '《ARM Cortex-M3与Cortex-M4权威指南》',
        type: '参考书',
        description: '适合补充 Cortex-M4 寄存器、异常中断、存储映射和位带操作等细节，具体章节需人工对应课内范围。',
      },
    ],
  },
  {
    code: 'BUPT_COMM',
    slug: 'bupt_communication_principles',
    title: '通信原理',
    shortTitle: '通原',
    summary: '先把信号、概率和系统观点补齐，再围绕“如何可靠传输信息”理解调制、噪声、误码率和编码。',
    route: ['信号与噪声基础', '模拟调制', '数字基带', '数字调制', '信道编码'],
    chapters: [
      {
        title: '第 1 章：通信系统模型',
        focus: '信息源、信道、噪声、带宽、功率、信噪比和性能指标。',
        checklist: ['能画系统框图', '理解带宽与速率', '会解释 SNR/BER'],
      },
      {
        title: '第 2-3 章：模拟调制',
        focus: 'AM、DSB、SSB、FM 的频谱、带宽和抗噪声特点。',
        checklist: ['会看调制频谱', '会算带宽', '能比较不同调制方式'],
      },
      {
        title: '第 4-5 章：数字基带',
        focus: '码型、无码间串扰、眼图、匹配滤波和最佳接收。',
        checklist: ['理解奈奎斯特准则', '会解释眼图', '能处理基带传输题'],
      },
      {
        title: '第 6-7 章：数字调制与编码',
        focus: 'ASK/FSK/PSK、QAM、误码率、信道编码和同步问题。',
        checklist: ['会比较调制星座图', '会用 BER 公式', '理解编码增益'],
      },
    ],
    mindMap: [
      { title: '模型', children: ['信源', '信道', '噪声', '性能指标'] },
      { title: '模拟', children: ['AM', 'DSB', 'SSB', 'FM'] },
      { title: '基带', children: ['码型', 'ISI', '眼图', '匹配滤波'] },
      { title: '数字', children: ['ASK', 'FSK', 'PSK/QAM', '编码'] },
    ],
    studySummary: [
      { title: '系统主线', points: ['信源到接收端', '信道与噪声', '有效性与可靠性'] },
      { title: '公式抓手', points: ['带宽', '功率谱', '信噪比', '误码率'] },
      { title: '题型抓手', points: ['调制频谱', '无码间串扰', '眼图分析', '星座图比较'] },
    ],
    outcomes: ['能解释公式背后的物理意义', '能完成调制带宽和误码率计算', '能把章节串成系统传输链路'],
    resources: [
      { title: '通信原理公式对照表', type: '知识卡', description: '按“用在哪、算什么、怎么看结果”整理公式。' },
      { title: '数字基带章节路线', type: '章节路线', description: '从码型到眼图再到最佳接收，避免直接背结论。' },
    ],
    publicMaterials: [
      {
        title: 'MIT 6.02 Digital Communication Systems',
        type: '公开课',
        description: '以 bits、signals、packets 三层组织通信系统，适合补信道、编码、噪声和系统视角。',
        url: 'https://ocw.mit.edu/courses/6-02-introduction-to-eecs-ii-digital-communication-systems-fall-2012/',
      },
      {
        title: 'MIT 6.450 Principles of Digital Communications I',
        type: '视频课',
        description: '偏理论推导，适合在学完课内调制、信道、噪声后做拔高参考。',
        url: 'https://www.youtube.com/watch?v=KXFF8m4uGDc',
      },
      {
        title: 'Proakis《Digital Communications》',
        type: '教材',
        description: '数字通信经典教材，适合查调制、检测、误码率和信道编码的标准推导。',
      },
    ],
  },
  {
    code: 'BUPT_DL',
    slug: 'bupt_deep_learning_pytorch',
    title: '深度学习（PyTorch）',
    shortTitle: '深度学习',
    summary: '用 PyTorch 先跑通训练闭环，再逐步理解 MLP、CNN、序列模型和 Transformer，最后关注调参和复现实验。',
    route: ['PyTorch 基础', 'MLP 与反向传播', 'CNN', 'RNN/Transformer', '调参与复现'],
    chapters: [
      {
        title: '第 1 章：Tensor 与 autograd',
        focus: '张量、广播、计算图、自动求导、Dataset/DataLoader。',
        checklist: ['能写训练循环', '会检查 tensor shape', '理解 loss.backward()'],
      },
      {
        title: '第 2 章：MLP 与优化',
        focus: '线性层、激活函数、损失函数、SGD/Adam、正则化。',
        checklist: ['能训练分类器', '会看 loss 曲线', '知道过拟合怎么处理'],
      },
      {
        title: '第 3 章：CNN',
        focus: '卷积、池化、感受野、BatchNorm、经典网络结构。',
        checklist: ['会计算输出尺寸', '能改写 CNN 模型', '理解特征图含义'],
      },
      {
        title: '第 4-5 章：序列模型与 Transformer',
        focus: 'RNN/LSTM、注意力机制、Transformer 编码器和微调思路。',
        checklist: ['理解 attention 输入输出', '能跑通文本/序列小实验', '会保存与加载模型'],
      },
    ],
    mindMap: [
      { title: '框架', children: ['Tensor', 'autograd', 'DataLoader', 'Module'] },
      { title: '训练', children: ['loss', 'optimizer', 'regularization', 'metrics'] },
      { title: '模型', children: ['MLP', 'CNN', 'RNN', 'Transformer'] },
      { title: '工程', children: ['复现', '日志', '调参', '保存模型'] },
    ],
    studySummary: [
      { title: '训练主线', points: ['Dataset/DataLoader', 'forward', 'loss', 'backward', 'optimizer.step'] },
      { title: '模型抓手', points: ['MLP', 'CNN', 'RNN/LSTM', 'Transformer'] },
      { title: '实验风险', points: ['shape 不匹配', '过拟合', '学习率不稳', '随机种子未固定'] },
    ],
    outcomes: ['能独立完成 PyTorch 训练闭环', '能解释 CNN/Transformer 基本结构', '能整理一份实验复现报告'],
    resources: [
      { title: 'PyTorch 第一周实验路线', type: '实验', description: '从 Tensor 到 DataLoader，再到 MLP/CNN 训练。' },
      { title: '训练调参检查表', type: '清单', description: '学习率、batch、归一化、随机种子、日志和模型保存。' },
    ],
    publicMaterials: [
      {
        title: 'PyTorch 官方 Learn the Basics',
        type: '官方教程',
        description: '从 Tensor、Dataset/DataLoader、模型、自动求导到训练与保存，适合作为第一轮实操入口。',
        url: 'https://docs.pytorch.org/tutorials/beginner/basics/intro.html',
      },
      {
        title: 'Stanford CS231n',
        type: '公开课',
        description: '视觉方向深度学习经典课，适合重点补 CNN、反向传播、训练调参和项目实践。',
        url: 'https://cs231n.stanford.edu/2021/',
      },
      {
        title: 'Dive into Deep Learning',
        type: '在线教材',
        description: '代码和原理结合紧密，可作为 PyTorch 实验与模型理解的长期参考。',
        url: 'https://d2l.ai/',
      },
      {
        title: 'Goodfellow/Bengio/Courville《Deep Learning》',
        type: '教材',
        description: '理论体系更完整，适合查线性代数、概率、优化、CNN/RNN 等概念背景。',
        url: 'https://www.deeplearningbook.org/',
      },
    ],
  },
];

export type CourseSemester = '大一上' | '大一下' | '大二上' | '大二下' | '大三上';
export type CourseCollege = '北邮信通院' | '北邮计算机院';

const generatedCatalog = generatedCourseCatalog as Record<CourseSemester, CourseGuide[]>;

const generatedGuideMap = (generatedCourseGuides as CourseGuide[]).reduce<Record<string, CourseGuide>>(
  (acc, guide) => {
    acc[guide.slug] = guide;
    return acc;
  },
  {},
);

const manualGuideMap = manualCourseGuides.reduce<Record<string, CourseGuide>>((acc, guide) => {
  acc[guide.slug] = guide;
  return acc;
}, {});

const withManualMaterials = (guide: CourseGuide | undefined): CourseGuide | undefined => {
  if (!guide) {
    return guide;
  }
  const manualGuide = manualGuideMap[guide.slug];
  if (!manualGuide?.publicMaterials.length) {
    return guide;
  }

  const materialMap = new Map<string, ResourceRecommendation>();
  [...guide.publicMaterials, ...manualGuide.publicMaterials].forEach((item) => {
    materialMap.set(`${item.type}-${item.title}`, item);
  });

  return {
    ...guide,
    publicMaterials: Array.from(materialMap.values()),
  };
};

export const buptCourseGuides: CourseGuide[] = [
  withManualMaterials(generatedGuideMap.bupt_discrete_math) || manualGuideMap.bupt_discrete_math,
  manualGuideMap.bupt_programming_practice,
  withManualMaterials(generatedGuideMap.bupt_computer_organization) || manualGuideMap.bupt_computer_organization,
  withManualMaterials(generatedGuideMap.bupt_communication_principles) || manualGuideMap.bupt_communication_principles,
  withManualMaterials(generatedGuideMap.bupt_deep_learning_pytorch) || manualGuideMap.bupt_deep_learning_pytorch,
].filter((guide): guide is CourseGuide => Boolean(guide));

const uniqueGuides = (guides: CourseGuide[]): CourseGuide[] => {
  const guideMap = new Map<string, CourseGuide>();
  guides.forEach((guide) => {
    guideMap.set(guide.slug, guide);
  });
  return Array.from(guideMap.values());
};

export const courseGuidesBySemester: Record<CourseSemester, CourseGuide[]> = {
  大一上: generatedCatalog.大一上 || [],
  大一下: generatedCatalog.大一下 || [],
  大二上: generatedCatalog.大二上 || [],
  大二下: uniqueGuides([...buptCourseGuides, ...(generatedCatalog.大二下 || [])]),
  大三上: generatedCatalog.大三上 || [],
};

const allCourseGuides = [...Object.values(generatedCatalog).flat(), ...buptCourseGuides];

export const coursePool = allCourseGuides.reduce<Record<string, CourseGuide>>((acc, guide) => {
  acc[guide.slug] = guide;
  return acc;
}, {});

const getGuidesBySlug = (slugs: string[]): CourseGuide[] => {
  return slugs.map((slug) => coursePool[slug]).filter((guide): guide is CourseGuide => Boolean(guide));
};

export const courseRefsByCollege: Record<CourseCollege, Record<CourseSemester, string[]>> = {
  北邮信通院: {
    大一上: [
      'bupt_linear_algebra',
      'bupt_mathematical_analysis_1',
      'bupt_cpp_fundamentals',
    ],
    大一下: [
      'bupt_electronic_circuit_fundamentals',
      'bupt_mathematical_analysis_2',
      'bupt_university_physics_1',
    ],
    大二上: [
      'bupt_probability_mathematical_statistics',
      'bupt_signal_analysis_and_processing',
      'bupt_data_structures_algorithms',
      'bupt_university_physics_2',
      'bupt_digital_electronics',
      'bupt_engineering_mathematics',
    ],
    大二下: [
      'bupt_discrete_math',
      'bupt_programming_practice',
      'bupt_computer_organization',
      'bupt_communication_principles',
      'bupt_deep_learning_pytorch',
    ],
    大三上: courseGuidesBySemester.大三上.map((guide) => guide.slug),
  },
  北邮计算机院: {
    大一上: [
      'bupt_linear_algebra',
      'bupt_mathematical_analysis_1',
      'bupt_cpp_fundamentals',
    ],
    大一下: [
      'bupt_electronic_circuit_fundamentals',
      'bupt_mathematical_analysis_2',
      'bupt_university_physics_1',
    ],
    大二上: [
      'bupt_probability_mathematical_statistics',
      'bupt_data_structures_algorithms',
      'bupt_university_physics_2',
      'bupt_digital_electronics',
      'bupt_computer_systems_csapp',
      'bupt_engineering_mathematics',
      'bupt_discrete_math',
      'bupt_computer_organization',
    ],
    大二下: [
      'bupt_operating_systems',
      'bupt_deep_learning_pytorch',
      'bupt_computer_graphics',
    ],
    大三上: [
      'bupt_computer_graphics',
      'bupt_geographic_information_systems',
      'bupt_media_and_cognition',
      'bupt_digital_audio_video_principles',
      'bupt_information_theory_fundamentals',
    ],
  },
};

export const courseGuidesByCollege: Record<CourseCollege, Record<CourseSemester, CourseGuide[]>> = {
  北邮信通院: {
    大一上: getGuidesBySlug(courseRefsByCollege.北邮信通院.大一上),
    大一下: getGuidesBySlug(courseRefsByCollege.北邮信通院.大一下),
    大二上: getGuidesBySlug(courseRefsByCollege.北邮信通院.大二上),
    大二下: getGuidesBySlug(courseRefsByCollege.北邮信通院.大二下),
    大三上: getGuidesBySlug(courseRefsByCollege.北邮信通院.大三上),
  },
  北邮计算机院: {
    大一上: getGuidesBySlug(courseRefsByCollege.北邮计算机院.大一上),
    大一下: getGuidesBySlug(courseRefsByCollege.北邮计算机院.大一下),
    大二上: getGuidesBySlug(courseRefsByCollege.北邮计算机院.大二上),
    大二下: getGuidesBySlug(courseRefsByCollege.北邮计算机院.大二下),
    大三上: getGuidesBySlug(courseRefsByCollege.北邮计算机院.大三上),
  },
};

export const courseColleges = Object.keys(courseGuidesByCollege) as CourseCollege[];
export const courseSemesters = Object.keys(courseGuidesBySemester) as CourseSemester[];

export const buptCourseGuideMap = Object.values(courseGuidesByCollege).reduce<Record<string, CourseGuide>>((acc, semesterMap) => {
  Object.values(semesterMap).flat().forEach((guide) => {
    acc[guide.code] = guide;
    acc[guide.slug] = guide;
  });
  return acc;
}, {});
