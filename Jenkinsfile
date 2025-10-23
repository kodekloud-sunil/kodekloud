pipeline {
    agent any
    tools {
        nodejs 'nodejs-20'
    }
    stages{
        stage ('node version'){
            steps {
                sh 'node -v'
                sh 'npm -v'
            }
        }
    }
}