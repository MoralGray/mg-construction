import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { createAdapter } from './adapter.js';

const EXECUTOR_NAMES = [
    'Иванов Иван Иванович',
    'Петров Пётр Петрович',
    'Сидоров Сидор Сидорович',
    'Кузнецов Николай Алексеевич',
    'Смирнов Андрей Владимирович',
    'Попов Дмитрий Сергеевич',
    'Лебедев Алексей Михайлович',
    'Козлов Сергей Павлович',
    'Новиков Владимир Игоревич',
    'Морозов Михаил Фёдорович',
    'Волков Александр Борисович',
    'Захаров Евгений Викторович',
    'Соколов Денис Олегович',
    'Фёдоров Максим Николаевич',
    'Орлов Роман Александрович',
    'Михайлов Артём Станиславович',
    'Белов Павел Валерьевич',
    'Григорьев Илья Геннадьевич',
    'Тимофеев Константин Дмитриевич',
    'Васильев Антон Юрьевич',
    'Алексеев Виктор Степанович',
    'Степанов Вадим Эдуардович',
    'Яковлев Олег Тарасович',
    'Семёнов Глеб Романович',
    'Голубев Тимур Борисович',
    'Дмитриев Егор Аркадьевич',
    'Баранов Кирилл Владиславович',
    'Кириллов Вячеслав Олегович',
    'Осипов Станислав Игоревич',
    'Макаров Родион Петрович',
    'Чернов Савелий Андреевич',
    'Павлов Богдан Эдуардович',
    'Быков Марк Семёнович',
    'Фомин Даниил Максимович',
    'Гусев Лев Николаевич',
    'Давыдов Матвей Павлович',
    'Ковалёв Ярослав Олегович',
    'Зуев Платон Алексеевич',
    'Сорокин Гордей Валерьевич',
    'Беляев Мирослав Ильич',
    'Виноградов Святослав Аркадьевич',
    'Тарасов Добрыня Викторович',
    'Крылов Серафим Борисович',
    'Савельев Аким Романович',
    'Карпов Радислав Кириллович',
    'Никитин Любомир Григорьевич',
    'Медведев Венедикт Станиславович',
    'Ефимов Ростислав Данилович',
    'Трофимов Лаврентий Игоревич',
    'Назаров Владлен Петрович',
];

const DESCRIPTIONS = [
    'Выполнены работы согласно технологической карте',
    'Работы проведены в соответствии с графиком',
    'Произведён осмотр и приёмка выполненных работ',
    'Работы выполнены с надлежащим качеством',
    'Произведён демонтаж старых конструкций',
    'Подготовка поверхности перед основными работами',
    'Установка временных ограждений и знаков безопасности',
    'Работы выполнены в зимних условиях с подогревом',
    'Проведён контрольный замер выполненных объёмов',
    'Усиление конструкций по проекту',
    'Гидроизоляция выполнена в два слоя',
    'Антикоррозийная обработка металлоконструкций',
    'Устройство временного освещения',
    'Входной контроль материалов и комплектующих',
    'Дополнительные работы по замечаниям заказчика',
    'Выполнены скрытые работы с составлением актов',
    'Проверка геодезической разбивки осей',
    'Монтаж с использованием автовышки',
    'Работы в зоне действующих коммуникаций',
    'Произведено усиление существующих конструкций',
];

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
    const diff = end.getTime() - start.getTime();
    const offset = Math.random() * diff;
    return new Date(start.getTime() + offset);
}

function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
    const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';
    const adapter = createAdapter(url);
    const prisma = new PrismaClient({ adapter });

    await prisma.$connect();
    console.log('Connected to database');

    const roads = await prisma.road.findMany();
    const workTypes = await prisma.workType.findMany();

    if (roads.length === 0 || workTypes.length === 0) {
        console.error('No roads or work types found. Run seed first: npm run seed');
        await prisma.$disconnect();
        process.exit(1);
    }

    console.log(`Found ${roads.length} roads and ${workTypes.length} work types`);

    const startDate = new Date('2025-01-01');
    const endDate = new Date('2026-06-30');

    const entries = Array.from({ length: 100 }, () => {
        const rand = Math.random();
        let topicId: number | undefined;
        if (rand < 0.3) {
            topicId = 1;
        } else if (rand < 0.4) {
            topicId = 2;
        }

        const statusRand = Math.random();
        const workDone = statusRand < 0.6;
        const workInProgress = statusRand >= 0.6 && statusRand < 0.85;
        const workStopped = statusRand >= 0.85;

        return {
            date: randomDate(startDate, endDate),
            roadId: randomChoice(roads).id,
            workTypeId: randomChoice(workTypes).id,
            volume: randomInt(1, 500),
            executorName: randomChoice(EXECUTOR_NAMES),
            description: randomChoice(DESCRIPTIONS),
            topicId: topicId ?? null,
            workDone,
            workInProgress,
            workStopped,
        };
    });

    const result = await prisma.workLogEntry.createMany({ data: entries });
    console.log(`Inserted ${result.count} mock work log entries`);

    await prisma.$disconnect();
    console.log('Mock seed complete');
}

main().catch((e) => {
    console.error('Mock seed failed:', e);
    process.exit(1);
});
