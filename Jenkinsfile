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
        stage ('Dependencies Audit') {
            parallel {
                stage('default audit') {
                    steps {
                        sh 'npm audit --audit-level=critical'
                    }
                }
                stage ('OWASP Audit'){
                    steps {
                        dependencyCheck additionalArguments: '''
                            --scan "./"
                            --out "./"
                            --format "ALL"
                            --prettyPrint''', odcInstallation: 'dep-check-10'
                    }
                }
            }
        }
    }
}