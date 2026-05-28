# FIRESTORE RULES STRICT

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function hasRole(role) {
      return request.auth.token.role == role;
    }

    match /patients/{patientId} {

      allow read: if isAuthenticated();

      allow create: if hasRole('admin')
                     || hasRole('loket');

      allow update: if hasRole('admin')
                     || hasRole('nakes');

      allow delete: if hasRole('admin');
    }

    match /staff/{staffId} {
      allow read: if hasRole('admin');
      allow write: if hasRole('admin');
    }
  }
}
```