git add .
timeout /t 4

set /p input="Enter Commit Message - "
git commit -am "%input%"

timeout /t 5

git push
timeout /t 5