/**
 * Скрипт для проверки и деплоя на Netlify
 * Запуск: node scripts/deploy-to-netlify.js
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Функция для выполнения команды и вывода результата
function runCommand(command) {
  console.log(`\n> Выполняем: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return true;
  } catch (error) {
    console.error(`Ошибка при выполнении команды: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Основная функция
async function main() {
  console.log('=== Проверка и деплой на Netlify ===');
  
  // Проверяем наличие изменений в Git
  console.log('\n> Проверка статуса Git...');
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  
  if (gitStatus) {
    console.log('Обнаружены незакоммиченные изменения:');
    console.log(gitStatus);
    
    const answer = await new Promise(resolve => {
      rl.question('Хотите закоммитить изменения перед деплоем? (y/n): ', resolve);
    });
    
    if (answer.toLowerCase() === 'y') {
      const commitMessage = await new Promise(resolve => {
        rl.question('Введите сообщение коммита: ', resolve);
      });
      
      if (!runCommand(`git add .`)) {
        console.error('Ошибка при добавлении файлов в индекс Git');
        process.exit(1);
      }
      
      if (!runCommand(`git commit -m "${commitMessage}"`)) {
        console.error('Ошибка при создании коммита');
        process.exit(1);
      }
    } else {
      console.log('Продолжаем без коммита изменений...');
    }
  } else {
    console.log('Нет незакоммиченных изменений.');
  }
  
  // Запускаем линтер
  console.log('\n> Запуск линтера...');
  if (!runCommand('npm run lint')) {
    const answer = await new Promise(resolve => {
      rl.question('Линтер обнаружил ошибки. Продолжить деплой? (y/n): ', resolve);
    });
    
    if (answer.toLowerCase() !== 'y') {
      console.log('Деплой отменен.');
      process.exit(1);
    }
  }
  
  // Собираем проект
  console.log('\n> Сборка проекта...');
  if (!runCommand('npm run build')) {
    console.error('Ошибка при сборке проекта');
    process.exit(1);
  }
  
  // Предварительный деплой на Netlify
  console.log('\n> Предварительный деплой на Netlify...');
  if (!runCommand('npx netlify deploy')) {
    const answer = await new Promise(resolve => {
      rl.question('Предварительный деплой завершился с ошибками. Продолжить с полным деплоем? (y/n): ', resolve);
    });
    
    if (answer.toLowerCase() !== 'y') {
      console.log('Деплой отменен.');
      process.exit(1);
    }
  }
  
  // Спрашиваем о полном деплое
  const deployAnswer = await new Promise(resolve => {
    rl.question('\nВыполнить полный деплой на Netlify? (y/n): ', resolve);
  });
  
  if (deployAnswer.toLowerCase() === 'y') {
    console.log('\n> Выполняем полный деплой на Netlify...');
    if (!runCommand('npx netlify deploy --prod')) {
      console.error('Ошибка при выполнении полного деплоя');
      process.exit(1);
    }
    
    console.log('\n✅ Деплой успешно завершен!');
    
    // Спрашиваем о пуше в репозиторий
    const pushAnswer = await new Promise(resolve => {
      rl.question('\nОтправить изменения в удаленный репозиторий? (y/n): ', resolve);
    });
    
    if (pushAnswer.toLowerCase() === 'y') {
      console.log('\n> Отправка изменений в удаленный репозиторий...');
      if (!runCommand('git push')) {
        console.error('Ошибка при отправке изменений в удаленный репозиторий');
        process.exit(1);
      }
      
      console.log('\n✅ Изменения успешно отправлены в удаленный репозиторий!');
    }
  } else {
    console.log('Полный деплой отменен.');
  }
  
  rl.close();
}

main().catch(error => {
  console.error('Произошла ошибка:', error);
  process.exit(1);
});
