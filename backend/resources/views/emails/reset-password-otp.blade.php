<x-mail::message>
# Réinitialisation de votre mot de passe

Bonjour,

Vous avez demandé la réinitialisation de votre mot de passe pour votre compte **Gestion Stock**.

Utilisez le code de vérification ci-dessous pour confirmer votre identité :

<x-mail::panel>
## {{ $otp }}
</x-mail::panel>

Ce code est valable pendant **15 minutes**. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.

Merci,<br>
L'équipe {{ config('app.name') }}
</x-mail::message>
