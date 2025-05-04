/**
 * Скрипт для деплоя на дополнительный сайт Netlify, подключенный к репозиторию PixelPandemic
 * Запуск: node scripts/deploy-to-secondary-netlify.js
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
  console.log('=== Деплой на дополнительный сайт Netlify (PixelPandemic) ===');
  
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
  
  // Собираем проект
  console.log('\n> Сборка проекта...');
  if (!runCommand('npm run build')) {
    console.error('Ошибка при сборке проекта');
    process.exit(1);
  }
  
  // Спрашиваем о выборе сайта Netlify
  const siteId = await new Promise(resolve => {
    rl.question('\nВведите ID или имя дополнительного сайта Netlify (оставьте пустым для выбора из списка): ', resolve);
  });
  
  // Предварительный деплой на дополнительный сайт Netlify
  console.log('\n> Предварительный деплой на дополнительный сайт Netlify...');
  let deployCommand = 'npx netlify deploy';
  
  if (siteId) {
    deployCommand += ` --site=${siteId}`;
  }
  
  if (!runCommand(deployCommand)) {
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
    rl.question('\nВыполнить полный деплой на дополнительный сайт Netlify? (y/n): ', resolve);
  });
  
  if (deployAnswer.toLowerCase() === 'y') {
    console.log('\n> Выполняем полный деплой на дополнительный сайт Netlify...');
    let prodDeployCommand = 'npx netlify deploy --prod';
    
    if (siteId) {
      prodDeployCommand += ` --site=${siteId}`;
    }
    
    if (!runCommand(prodDeployCommand)) {
      console.error('Ошибка при выполнении полного деплоя');
      process.exit(1);
    }
    
    console.log('\n✅ Деплой на дополнительный сайт Netlify успешно завершен!');
    
    // Спрашиваем о пуше в репозиторий PixelPandemic
    const pushAnswer = await new Promise(resolve => {
      rl.question('\nОтправить изменения в репозиторий PixelPandemic? (y/n): ', resolve);
    });
    
    if (pushAnswer.toLowerCase() === 'y') {
      // Проверяем наличие удаленного репозитория pixelpandemic1
      try {
        execSync('git remote get-url pixelpandemic1', { encoding: 'utf8' });
        console.log('\n> Отправка изменений в репозиторий PixelPandemic...');
        
        if (!runCommand('git push pixelpandemic1 master')) {
          console.error('Ошибка при отправке изменений в репозиторий PixelPandemic');
          
          const retryAnswer = await new Promise(resolve => {
            rl.question('Хотите настроить доступ к репозиторию PixelPandemic? (y/n): ', resolve);
          });
          
          if (retryAnswer.toLowerCase() === 'y') {
            console.log('\n> Для настройки доступа к репозиторию PixelPandemic выполните следующие шаги:');
            console.log('1. Создайте новый персональный токен доступа (PAT) на GitHub с правами repo');
            console.log('2. Настройте удаленный репозиторий с помощью команды:');
            console.log('   git remote set-url pixelpandemic1 https://USERNAME:TOKEN@github.com/PixelPandemic/mart1.git');
            console.log('   (замените USERNAME на ваше имя пользователя GitHub и TOKEN на ваш PAT)');
            console.log('3. Повторите попытку отправки изменений:');
            console.log('   git push pixelpandemic1 master');
          }
        } else {
          console.log('\n✅ Изменения успешно отправлены в репозиторий PixelPandemic!');
        }
      } catch (error) {
        console.error('Удаленный репозиторий pixelpandemic1 не настроен');
        
        const setupAnswer = await new Promise(resolve => {
          rl.question('Хотите настроить удаленный репозиторий pixelpandemic1? (y/n): ', resolve);
        });
        
        if (setupAnswer.toLowerCase() === 'y') {
          const repoUrl = await new Promise(resolve => {
            rl.question('Введите URL репозитория PixelPandemic (например, https://github.com/PixelPandemic/mart1.git): ', resolve);
          });
          
          if (!runCommand(`git remote add pixelpandemic1 ${repoUrl}`)) {
            console.error('Ошибка при добавлении удаленного репозитория');
            process.exit(1);
          }
          
          console.log('\n✅ Удаленный репозиторий pixelpandemic1 успешно добавлен!');
          console.log('Для отправки изменений выполните команду:');
          console.log('git push pixelpandemic1 master');
        }
      }
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
