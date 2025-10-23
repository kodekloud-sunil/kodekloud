pipeline {
    agent any
    tools {
        nodejs 'nodejs-20'
    }
    stages{
        stage ('Install Dependencies'){
            steps {
                sh 'npm install --no-audit'
            }
        }
        stage('Dependencies Audit'){
            steps{
                sh 'npm audit --audit-level=critical'
            }
        }
    }
}