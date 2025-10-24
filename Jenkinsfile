pipeline {
    agent any
    tools {
        nodejs 'nodejs-20'
    }
    environment {
        MONGO_URI = 'mongodb+srv://supercluster.d83jj.mongodb.net/superData'
        MOCHA_CHECKS_API = 'false'
        MONGO_USERNAME = credentials('mongo-username')
        MONGO_PASSWORD = credentials('mongo-password')
        SONAR_HOME = tool 'sonar-scanner'
    }
    stages{
        // stage ('Install Dependencies'){
        //     steps {
        //         sh 'npm install --no-audit'
        //     }
        // }
        // stage ('Dependencies Audit') {
        //     parallel {
        //         stage('default audit') {
        //             steps {
        //                 sh 'npm audit --audit-level=critical'
        //             }
        //         }
        //         stage ('OWASP Audit'){
        //             steps {
        //                 dependencyCheck additionalArguments: '''
        //                     --scan "./"
        //                     --out "./"
        //                     --format "ALL"
        //                     --disableYarnAudit
        //                     --prettyPrint''', odcInstallation: 'dep-check-10'
        //                 dependencyCheckPublisher failedTotalCritical: 1, pattern: 'dependency-check-report.xml', stopBuild: false

        //                 publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, icon: '', keepAll: true, reportDir: './', reportFiles: 'dependency-check-jenkins.html', reportName: 'Dependency check HTML Report', reportTitles: '', useWrapperFileDirectly: true])

        //                 junit allowEmptyResults: true, keepProperties: true, testResults: 'dependency-check-junit.xml'
        //             }
        //         }
        //     }
        // }
        // stage ('Run Tests'){
        //     steps {
        //         catchError(buildResult: 'SUCCESS') {
        //             sh 'npm test'
        //         }
        //     }
        // }
        // stage ('Coverage') {
        //     steps {
        //         catchError(buildResult: 'UNSTABLE') {
        //             sh 'npm run coverage'
        //         }
        //         publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, icon: '', keepAll: true, reportDir: './coverage/lcov-report', reportFiles: 'index.html', reportName: 'Code coverage Report', reportTitles: '', useWrapperFileDirectly: true])
        //     }
        // }
        // stage ('SAST - Sonarqube'){
        //     steps {
        //         timeout(time: 60, unit: 'SECONDS') {
        //             withSonarQubeEnv ('sunil-sonar-server') {
        //                 sh '''
        //                     $SONAR_HOME/bin/sonar-scanner \
        //                         -Dsonar.projectKey=kodekloud \
        //                         -Dsonar.sources=app.js \
        //                         -Dsonar.javascript.lcov.reportPaths=./coverage/lcov.info \
        //                 '''
        //             }
        //         }
        //         waitForQualityGate abortPipeline: true
        //     }
        // }
        stage ('Docker Build'){
            steps {
                sh 'docker build -t sunilpolaki/solar-app:$GIT_COMMIT .'
            }
        }
        stage('TRIVY Scan') {
            steps {
                sh '''
                    trivy image sunilpolaki/solar-app:${GIT_COMMIT} \
                        --severity LOW,MEDIUM \
                        --quiet \
                        --exit-code 0 \
                        --format json -o trivy-image-medium-report.json

                    trivy image sunilpolaki/solar-app:${GIT_COMMIT} \
                        --severity HIGH,CRITICAL \
                        --quiet \
                        --exit-code 0 \
                        --format json -o trivy-image-critical-report.json
                '''
            }
        }
    }
}