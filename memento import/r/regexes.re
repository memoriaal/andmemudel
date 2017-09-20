^([^\[]*[a-zõüäöščž]+)([A-ZÕÜÄÖČŽ]+)
$1-$2

([a-z])([A-Z])
$1-$2

(,)([^ 0-9])
$1 $2

( [ei]n)( ka )
$1.$2

([^,\.])( ka )
$1,$2

([^,])( [ei]n\. ka )
$1,$2

([^,])( s\. [0-9]{2,4})
$1,$2

( [0-9]{2}\.[0-9]{2}\.) ([0-9]{2,4}[\.,; ])
$1$2

^([0-9]{2})\.([0-9]{2})$
19$2-$1

^([0-9]{2})\.([0-9]{2})\.([0-9]{2})$
19$3-$2-$1

([^0-9]\.)([0-9])
$1 $2

(.*) in[,.] ka (.*)
$1;$2

// kontrollida:
[Ll]asti.*maha


^A-ZÕÜÄÖŠŽČ