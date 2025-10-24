pipeline {
    agent any
    tools {
        nodejs 'nodejs-20'
    }
    environment {
        MONGO_URI = 'mongodb+srv://supercluster.d83jj.mongodb.net/superData'
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
                            --disableYarnAudit
                            --prettyPrint''', odcInstallation: 'dep-check-10'
                        dependencyCheckPublisher failedTotalCritical: 1, pattern: 'dependency-check-report.xml'

                        publishHTML([allowMissing: false, alwaysLinkToLastBuild: false, icon: '', keepAll: false, reportDir: 'dependency-check-jenkins.html', reportFiles: 'index.html', reportName: 'dependency check HTML Report', reportTitles: '', useWrapperFileDirectly: true])

                        junit allowEmptyResults: true, keepProperties: true, testResults: 'dependency-check-junit.xml'
                    }
                }
            }
        }
        stage ('Run Tests'){
            steps {
                withCredentials([usernamePassword(credentialsId: 'mongodb-cred', passwordVariable: 'MONGO_PASSWORD', usernameVariable: 'MONGO_USERNAME')]) {
                    sh 'npm test'
                }
            }
        }
        stage ('Coverage') {
            steps {
                sh 'npm run coverage'
            }
        }
    }
}